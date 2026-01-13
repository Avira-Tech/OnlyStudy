// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         primary: {
//           50: '#f0f9ff',
//           100: '#e0f2fe',
//           200: '#bae6fd',
//           300: '#7dd3fc',
//           400: '#38bdf8',
//           500: '#0ea5e9',
//           600: '#0284c7',
//           700: '#0369a1',
//           800: '#075985',
//           900: '#0c4a6e',
//         },
//         secondary: {
//           50: '#f8fafc',
//           100: '#f1f5f9',
//           200: '#e2e8f0',
//           300: '#cbd5e1',
//           400: '#94a3b8',
//           500: '#64748b',
//           600: '#475569',
//           700: '#334155',
//           800: '#1e293b',
//           900: '#0f172a',
//         },
//         accent: {
//           50: '#fdf4ff',
//           100: '#fae8ff',
//           200: '#f5d0fe',
//           300: '#f0abfc',
//           400: '#e879f9',
//           500: '#d946ef',
//           600: '#c026d3',
//           700: '#a21caf',
//           800: '#86198f',
//           900: '#701a75',
//         },
//       },
//       fontFamily: {
//         sans: ['Inter', 'system-ui', 'sans-serif'],
//       },
//     },
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Brand / Accent */
        accent: {
          DEFAULT: '#00BFF3',
          hover: '#00A8DF',
          dark: '#0099C7',
        },

        /* Dark Theme Backgrounds */
        bg: {
          primary: '#1A1A1A',
          secondary: '#232323',
          tertiary: '#2A2A2A',
          card: '#2A2A2A',
          hover: '#333333',
        },

        /* Text Colors */
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B0B0',
          muted: '#8E8E8E',
          link: '#00BFF3',
        },

        /* Borders */
        border: {
          DEFAULT: '#3A3A3A',
          light: '#4A4A4A',
        },

        /* Status */
        success: '#00C853',
        warning: '#FFC107',
        error: '#FF5252',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      boxShadow: {
        'of-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'of-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
        'of-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
      },

      animation: {
        fadeIn: 'fadeIn 0.3s ease',
        slideUp: 'slideUp 0.3s ease',
        pulse: 'pulse 2s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
