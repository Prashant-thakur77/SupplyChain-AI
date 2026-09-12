"use server";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Creates a user via the Supabase Admin API, auto-confirming their email.
 * This bypasses SMTP rate limits on the free tier.
 */
export async function adminSignup(email: string, password: string) {
  try {
    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("Admin signup error:", error.message);
      throw new Error(error.message);
    }

    // Now sign the user in using the standard client method (browser-side)
    // or return the data so the client can handle the login.
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error("Internal admin signup error:", error.message);
    return { user: null, error: error.message };
  }
}
