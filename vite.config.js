import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import { publicSupabaseConfig } from './js/publicConfig.js';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  for (const key of [env.VITE_SUPABASE_ANON_KEY || '', publicSupabaseConfig.key]) {
    let role;
    try { role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role; } catch {}
    if (key.startsWith('sb_secret_') || (role && role !== 'anon'))
      throw new Error('Tarayıcı yapılandırmasında yalnız public anon/publishable key kullanılabilir.');
  }
  return {
  build: { rollupOptions: { input: {
    catalog: resolve(import.meta.dirname, 'index.html'),
    admin: resolve(import.meta.dirname, 'admin.html')
  } } }
  };
});
