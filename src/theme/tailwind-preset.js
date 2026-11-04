export default {
  theme: {
    extend: {
      colors: {
        accent: 'var(--q-accent)',
        'accent-hover': 'var(--q-accent-hover)',
        'accent-pressed': 'var(--q-accent-pressed)',
        chrome: 'var(--q-chrome)',
        hover: 'var(--q-hover)',
        border: 'var(--q-border)',
        primary: 'var(--q-text)',
        secondary: 'var(--q-secondary)',
        canvas: 'var(--q-canvas)',
        page: 'var(--q-page)',
        'accent-soft': 'var(--q-accent-soft)',
        'on-accent': 'var(--q-on-accent)',
      },
      fontFamily: { sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'] },
      boxShadow: { page: 'var(--q-page-shadow)' },
    },
  },
};
