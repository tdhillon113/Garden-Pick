import { createClient } from '@supabase/supabase-js'

const URL = 'https://mnjbppvqncoqmuosbulo.supabase.co'
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uamJwcHZxbmNvcW11b3NidWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTIzMTYsImV4cCI6MjA2OTQyODMxNn0.Q30x3qRdwTO5lK7-cZJG45XRH96IxBL-wQ8k01uDN8k'

export const supabase = createClient(URL, API_KEY)

// Trefle API token
export const TREFLE_TOKEN = import.meta.env.VITE_TREFLE_TOKEN || 'tzhObH78vd5vDiMQEYAshZQZGbX1QKYo_m3CegIv6JU'

// Helper functions for database operations
export const fetchFlowers = async () => {
  try {
    const { data, error } = await supabase
      .from("flowers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error details:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error fetching flowers:", err);
    throw err;
  }
};

export const saveFlower = async (flowerData) => {
  try {
    const { data, error } = await supabase
      .from("flowers")
      .insert([flowerData])
      .select();

    if (error) {
      console.error("Save error details:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("Error saving flower:", err);
    throw err;
  }
};
