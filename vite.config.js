import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/embed.js',
      name: 'GumletAddon',
      formats: ['iife'],
      fileName: () => 'gumlet-addon-embed.min.js',
    },
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
