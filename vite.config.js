// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path'; 

// Get the absolute path to your project root
const projectRoot = path.resolve(__dirname);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 💡 Alias: Manually maps the logical import name to the physical file location.
      // This solves the 'Failed to resolve import' error.
      'firebase/app': path.resolve(projectRoot, 'node_modules/firebase/app'),
      'firebase/auth': path.resolve(projectRoot, 'node_modules/firebase/auth'),
      'firebase/analytics': path.resolve(projectRoot, 'node_modules/firebase/analytics'),
    },
  },
  optimizeDeps: {
    // 💡 Optimization: Explicitly tells Vite to pre-bundle these problematic dependencies.
    // This helps avoid the "Failed to run dependency scan" error.
    include: [
      'firebase/app', 
      'firebase/auth',
      'firebase/analytics',
      'lucide-react', // Keep this here just in case
    ],
  },
});