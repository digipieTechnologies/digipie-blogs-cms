import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISH_KEY || "";

const isValidUrl = (url: string) => {
  try {
    return url.startsWith("http://") || url.startsWith("https://");
  } catch (e) {
    return false;
  }
};

const targetUrl = isValidUrl(supabaseUrl) ? supabaseUrl : "https://placeholder-project.supabase.co";
const targetKey = supabaseAnonKey || "placeholder-key";

export const supabase = createClient(targetUrl, targetKey);
