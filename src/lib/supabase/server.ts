//lib/supabase-server
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => {
          try {
            return (await cookies()).getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }));
          } catch {
            return [];
          }
        },
        setAll: async (cookieList) => {
          try {
            cookieList.map(async ({ name, value, options }) => {
              (await cookies()).set(name, value, options);
            });
          } catch {
            // Handle cookies in non-request contexts
          }
        },
      },
    }
  );
};
export const supabase = createClient();
