import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://siamtefl.com',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory'
  }
});
