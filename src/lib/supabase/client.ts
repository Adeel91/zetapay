import { databaseConfig } from '@/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = databaseConfig.supabaseUrl;
const supabaseAnonKey = databaseConfig.supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
