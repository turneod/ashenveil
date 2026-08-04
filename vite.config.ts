import { defineConfig } from 'vite';

// GitHub Pages proje sitesi için taban yol: https://turneod.github.io/ashenveil/
// Yerel geliştirmede ('npm run dev') kök '/' kullanılır.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/ashenveil/' : '/',
}));
