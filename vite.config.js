import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const key = env.VITE_SUPABASE_ANON_KEY || '';
  let role;
  try { role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role; } catch {}
  if (key.startsWith('sb_secret_') || role === 'service_role')
    throw new Error('VITE_SUPABASE_ANON_KEY için yalnız public anon/publishable key kullanılabilir.');
  if (mode === 'production' && env.VITE_DEMO_MODE === 'true')
    throw new Error('Production için VITE_DEMO_MODE=false kullanın. Önizleme: pnpm dev.');
  return {
  build: { rollupOptions: { input: {
    catalog: resolve(import.meta.dirname, 'index.html'),
    admin: resolve(import.meta.dirname, 'admin.html')
  } } }
  };
});
