// ─────────────────────────────────────────────────────────────────────────────
// tailwind-config.js  –  Tailwind CSS theme configuration.
// Must be loaded AFTER the Tailwind CDN script and BEFORE the body.
// ─────────────────────────────────────────────────────────────────────────────

tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "rgb(76, 42, 149)",
        "background-light": "#F5F5F7",
        "background-dark": "#1C1C1E",
        "accent-blue": "#007AFF",
        "bubble-beige": "#F9F9FB",
        "bubble-brown": "#8B5E3C",
        "user-bubble": "rgb(76, 42, 149)",
        "ai-bubble": "rgb(228, 230, 235)",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        chat: "18px",
      },
    },
  },
};
