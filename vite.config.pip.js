import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/pip.js',
      name: 'GumletEcommerceVideo',
      formats: ['iife'],
      fileName: () => 'gumlet-ecommerce-video.min.js',
    },
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    sourcemap: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
