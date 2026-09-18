import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  "https://oupymlwfjpgpkbdxsxhm.supabase.co",
  "sb_publishable_zk0JbeMHhJ3E1SJVJI-V6Q_TvPPWMjH"
);

export function authEmail(loginId) {
  return `${loginId.trim().toLowerCase()}@auth.orderdesk.com`;
}