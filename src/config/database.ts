if (typeof window === 'undefined' && process.release?.name === 'node') {
  import('dotenv')
    .then((dotenv) => {
      dotenv.config();
    })
    .catch((err) => {
      console.error('Failed to lazily load dotenv configuration:', err);
    });
}

export const databaseConfig = {
  databaseUrl: process.env.DATABASE_URL!,
  directDatabaseUrl: process.env.DIRECT_URL!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
};

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
