import quirePreset from '../src/theme/tailwind-preset.js';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [quirePreset],
  theme: { extend: {} },
  plugins: [],
};
