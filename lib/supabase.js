import "react-native-url-polyfill/auto"
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bibsshsdeajmlhqkfkpz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpYnNzaHNkZWFqbWxocWtma3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjQ3NjMsImV4cCI6MjA4NzE0MDc2M30.BDbClV1NcQ24ennQ_gqn9hBtyBylWGK43cBJOhL-d94"

export const supabase = createClient(supabaseUrl, supabaseKey);