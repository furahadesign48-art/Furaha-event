import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Plugin qui copie public/ → dist/ en excluant *.log (évite EBUSY sur les fichiers verrouillés)
function copyPublicWithoutLogsPlugin(publicDir: string, outDir: string) {
  const copyDirFiltered = (src: string, dest: string) => {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (entry.name.endsWith('.log')) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirFiltered(srcPath, destPath);
      } else {
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (_) {
          // Ignore les fichiers verrouillés
        }
      }
    }
  };
  return {
    name: 'copy-public-without-logs',
    apply: 'build' as const,
    closeBundle: () => {
      copyDirFiltered(
        path.resolve(__dirname, publicDir),
        path.resolve(__dirname, outDir),
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyPublicWithoutLogsPlugin('public', 'dist'),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    // Désactive la copie par défaut : notre plugin filtre les *.log
    copyPublicDir: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
