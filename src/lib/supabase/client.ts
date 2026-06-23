import { databaseConfig } from '@/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = databaseConfig.supabaseUrl;
const supabaseAnonKey = databaseConfig.supabaseAnonKey;

// Existing public client (Stays completely unchanged)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// NEW: Server-only Admin Client that bypasses RLS permissions safely in API routes
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || databaseConfig.supabaseAnonKey
);
