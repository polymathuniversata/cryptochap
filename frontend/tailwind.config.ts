import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          50: '#f0f9ff',
          100: '#e0f2fe', 
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          green: '#25D366',
          'green-dark': '#128C7E',
          'green-light': '#DCF8C6',
          'gray-light': '#F7F7F7',
          'gray-dark': '#34495E',
          bubble: '#E5E5E5',
          'bubble-own': '#DCF8C6',
          'bubble-crypto': '#E3F2FD'
        },
        crypto: {
          bitcoin: '#F7931A',
          ethereum: '#627EEA',
          usdc: '#2775CA',
          base: '#0052FF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'fade-in-down': 'fadeInDown 0.2s ease-in',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'progress': 'progress 5s linear',
        'pulse-opacity': 'pulseOpacity 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeInDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-3px)' },
          '60%': { transform: 'translateY(-2px)' },
        },
        progress: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        pulseOpacity: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      },
      boxShadow: {
        'whatsapp': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'message': '0 1px 2px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
};

export default config;