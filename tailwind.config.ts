import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Mononoki dla całego UI (monospace)
        mono: ['var(--font-mononoki)', 'ui-monospace', 'monospace'],
        // Zachowaj pozostałe czcionki dla specyficznych zastosowań
        serif: ['var(--font-crete-round)', 'serif'],
        display: ['var(--font-special-elite)', 'monospace'],
      },
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],  // domyślnie 0.75rem
        'sm': ['1rem', { lineHeight: '1.5rem' }],       // domyślnie 0.875rem
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // domyślnie 1rem (16px) -> teraz 18px
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      colors: {
        // Twoje kolory z AGENT_CONTEXT.md
        dracula: {
          bg: '#2E3436',
          current: '#282a36',
          selection: '#44475a',
          foreground: '#f8f8f2',
          comment: '#6272a4',
          cyan: '#8be9fd',
          green: '#50fa7b',
          orange: '#ffb86c',
          pink: '#ff79c6',
          purple: '#bd93f9',
          red: '#ff5555',
          yellow: '#f1fa8c',
        },
        // Dodatkowe kolory specyficzne dla aplikacji
        nav: {
          header: '#58448a',
          bg: '#282a36',
          sidebar: '#21222c',
          text: '#1D8D85',
          border: '#3465A4',
          arrow: '#4AC74D',
          hover: '#CABE4B',
        },
        related: {
          border: '#D57E31',
          text: '#ABA864',
          hover: '#CABE4B',
        },
        parts: {
          border: '#C792EA',
          text: '#C792EA',
          hover: '#FF80BF',
        }
      },
    },
  },
  plugins: [],
};

export default config;