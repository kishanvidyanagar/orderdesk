# OrderDesk

OrderDesk is a responsive restaurant ordering dashboard built with HTML, CSS, and browser JavaScript. The frontend uses Supabase Auth and Supabase Postgres for authentication, tenant data, orders, menu items, table configuration, and role-based access.

## Supabase setup

The browser client is configured in `frontend/js/supabase.js` with the project URL and publishable key. Privileged account operations use the JWT-protected `manage-account` Edge Function. Service-role credentials are never included in browser code.

The reproducible database migration is:

`supabase/migrations/20260918000100_orderdesk_schema.sql`

It creates the hotels, profiles, menu_items, table_configs, orders, and order_items tables, their relationships, indexes, triggers, helper functions, and RLS policies.

## Authentication

The existing Login ID fields remain unchanged. Login IDs map to internal synthetic Auth email aliases; passwords are handled only by Supabase Auth. Profiles store the application role and hotel assignment. Admins create owner accounts, and owners create waiter/cook accounts through the server-side Edge Function.

An initial admin Auth user and matching `profiles` row must be provisioned through the Supabase dashboard or a trusted administrative process before the first login.

## Run locally

Open `frontend/index.html` in a browser or use a local server such as VS Code Live Server. ES modules and the Supabase client require a browser origin in environments that block module imports from `file://` URLs.

## Security

RLS is enabled on every application table. Policies restrict records by the authenticated profile's role and `hotel_id`. Frontend checks are for navigation and usability only; database policies are the security boundary.
