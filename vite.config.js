import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'pages',
  publicDir: '../public',
  base: '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'pages/index.html'),
        'league-of-legends': resolve(__dirname, 'pages/league-of-legends.html'),
        'super-smash-bros': resolve(__dirname, 'pages/super-smash-bros.html'),
        impressum: resolve(__dirname, 'pages/impressum.html')
      }
    }
  }
});
