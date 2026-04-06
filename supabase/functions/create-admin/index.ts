import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "admin@admin.com";
    const password = "123456";

    // Check if admin exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    if (existing) {
      // Ensure profile exists
      await supabaseAdmin.from("profiles").upsert({
        id: existing.id,
        name: "ADMIN MASTER",
        email,
        role: "admin",
      }, { onConflict: "id" });

      return new Response(JSON.stringify({ success: true, message: "Admin already exists", id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "ADMIN MASTER", role: "admin" },
    });

    if (error) throw error;

    // Ensure profile
    await supabaseAdmin.from("profiles").upsert({
      id: data.user.id,
      name: "ADMIN MASTER",
      email,
      role: "coach",
    }, { onConflict: "id" });

    return new Response(JSON.stringify({ success: true, message: "Admin created", id: data.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
