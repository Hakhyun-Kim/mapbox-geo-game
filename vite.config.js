import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // The token is inlined into public JS, so only a public (pk.*) token may be used.
  const token = process.env.VITE_MAPBOX_TOKEN || loadEnv(mode, process.cwd()).VITE_MAPBOX_TOKEN || '';
  if (token && !token.startsWith('pk.')) {
    throw new Error('VITE_MAPBOX_TOKEN must be a Mapbox public token (pk.*). Secret tokens (sk.*) must never be shipped to the browser.');
  }
  // Relative base so the build works on GitHub Pages under any repo path.
  return { base: './' };
});
