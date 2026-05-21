import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#020617',
          panel: '#0f172a',
          border: '#1e293b',
          accent: '#22d3ee',
        },
      },
    },
  },
  plugins: [],
};

export default config;
