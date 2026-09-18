import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function emailFor(loginId: string) {
  return `${loginId.trim().toLowerCase()}@auth.orderdesk.com`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = request.headers.get("Authorization") || "";
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: callerData, error: callerError } = await serviceClient.auth.getUser(token);
    if (callerError || !callerData.user) throw new Error("Authentication required");
    const { data: caller } = await serviceClient.from("profiles").select("*").eq("id", callerData.user.id).single();
    if (!caller) throw new Error("Profile not found");

    const body = await request.json();
    const action = body.action;
    if (action === "create") {
      const canCreate = caller.role === "admin" || (caller.role === "owner" && body.role in { waiter: true, cook: true } && body.hotelId === caller.hotel_id);
      if (!canCreate) throw new Error("Not authorized to create this account");
      if (caller.role === "admin" && body.role !== "owner") throw new Error("Admins create owner accounts here");
      const { data: created, error: createError } = await serviceClient.auth.admin.createUser({ email: emailFor(body.loginId), password: body.password, email_confirm: true });
      if (createError || !created.user) throw createError || new Error("Unable to create account");
      const { error: profileError } = await serviceClient.from("profiles").insert({ id: created.user.id, login_id: body.loginId, role: body.role, hotel_id: body.hotelId, display_name: body.displayName, phone: body.phone || null, enabled: true });
      if (profileError) {
        await serviceClient.auth.admin.deleteUser(created.user.id);
        throw profileError;
      }
      return new Response(JSON.stringify({ id: created.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: target, error: targetError } = await serviceClient.from("profiles").select("*").eq("id", body.id).single();
    if (targetError || !target) throw new Error("Target account not found");
    const canManageTarget = caller.role === "admin" || (caller.role === "owner" && target.hotel_id === caller.hotel_id && ["waiter", "cook"].includes(target.role));
    if (!canManageTarget) throw new Error("Not authorized to manage this account");

    if (action === "update") {
      const updates: Record<string, unknown> = {};
      if (body.displayName !== undefined) updates.display_name = body.displayName;
      if (body.phone !== undefined) updates.phone = body.phone;
      if (body.loginId !== undefined) updates.login_id = body.loginId;
      if (body.enabled !== undefined) updates.enabled = body.enabled;
      if (body.loginId !== undefined) {
        const { error: authError } = await serviceClient.auth.admin.updateUserById(body.id, { email: emailFor(body.loginId), email_confirm: true });
        if (authError) throw authError;
      }
      const { error } = await serviceClient.from("profiles").update(updates).eq("id", body.id);
      if (error) throw error;
    } else if (action === "reset-password") {
      const { error } = await serviceClient.auth.admin.updateUserById(body.id, { password: body.password });
      if (error) throw error;
    } else if (action === "delete") {
      const { error } = await serviceClient.auth.admin.deleteUser(body.id);
      if (error) throw error;
    } else {
      throw new Error("Unsupported account action");
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
