const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is missing from backend/.env");
}

if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is missing from backend/.env");
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

module.exports = supabase;