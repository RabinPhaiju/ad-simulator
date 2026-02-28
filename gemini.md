# PocketPandit AI Ad Simulator

This project is a web-based tool designed to simulate and record chat interactions with **PocketPandit AI** (an astrology-focused AI assistant). It is primarily used to generate high-quality video ads or previews by providing a realistic mobile UI mockup coupled with a real-time content editor and screen recording capabilities.

## 🚀 Key Features

*   **Realistic Mobile Mockup**: A pixel-perfect phone UI simulation with smooth scrolling and interactive elements.
*   **Real-time Content Editor**: A side panel that allow users to update chat messages, titles, subtitles, and CTA buttons on the fly.
*   **Animated Chat Interaction**:
    *   **Word-by-word Typing**: AI responses are animated to simulate natural typing.
    *   **Message Fading**: User messages and follow-up bubbles appear with smooth transitions.
    *   **User Typing Indicator**: A `...` animated bubble is shown before each user message appears, making the conversation feel live and real.
*   **Variable Typing Speed**: A 5-step slider (Slow → Thoughtful → Normal → Brisk → Hype) lets you control how fast the AI types.
*   **Dynamic UI Toggles**:
    *   Switch AI response positions (Left vs. Right).
    *   Toggle visibility of specific elements (Astrological Chart, Birth Details, CTA Button, etc.).
*   **Aspect Ratio Presets**: One-click buttons to resize the preview to **9:16 (TikTok)**, **1:1 (Instagram Feed)**, or **4:5 (Facebook)**.
*   **Phone Frame Overlays**: Toggle between **Frameless**, **iPhone 15 Pro** (with Dynamic Island), and **Android** (with punch-hole camera) shells.
*   **Built-in Screen Recorder**: A specialized tool to capture the mobile preview area (Region Capture) to generate video assets for ads.
    *   **Auto-Stop**: A checkbox to automatically stop recording when the animation ends — no manual trimming needed.
*   **Astrological Integration**: Specialized components for birth details and chart visualization.

## 🛠 Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3.
- **Styling**:
  - [Tailwind CSS](https://tailwindcss.com/) (CDN-based for utility styles).
  - Custom CSS modules for specific component logic.
  - Google Fonts (Inter, Playfair Display).
- **Recording**: Browser `getDisplayMedia` API (MediaRecorder) for capturing video output.
- **Utilities**: Material Symbols for iconography.

## 📂 Project Structure

```text
├── index.html          # Main entry point (Main layout & App container)
├── tailwind-config.js  # Custom Tailwind configuration
├── js/
│   ├── app.js          # Main entry point & initialization logic
│   ├── config.js       # Global configuration constants (animation timings, speed presets)
│   ├── dialogs.js      # CENTRALIZED TEXT CONTENT (Edit this for chat changes)
│   ├── dom-helpers.js  # UI utility functions (setText, fadeIn)
│   ├── editor.js       # Content editor sidebar logic (incl. speed slider)
│   ├── recorder.js     # Screen recording engine (incl. auto-stop)
│   ├── scroll.js       # Chat scrolling and bottom-anchoring logic
│   └── typing.js       # Word-by-word typing animation engine
└── styles/
    ├── base.css        # Fundamental resets and CSS variables
    ├── layout.css      # Core grid/flex layout for the app
    ├── editor.css      # Styling for the sidebar control panel
    ├── chat.css        # Mobile phone UI and message bubble styles
    ├── animations.css  # Typing cursor and fade-in keyframes
    ├── frames.css      # Phone frames, aspect ratio presets, speed slider, user typing dots
    ├── toggles.css     # Logic for custom switches and layout swaps
    └── recorder.css    # Record button styles and status indicators
```

## 📝 How to Use

1.  **Change Chat Content**: Open `js/dialogs.js` and modify the `DIALOGS` object. The UI will update automatically (or via the editor panel).
2.  **Adjust Layout**: Use the **Content Editor** on the right to toggle elements or change the AI's position.
3.  **Record an Ad**:
    - Click the **Record** button in the editor.
    - Select the tab/window to record (ideally use Region Capture if supported).
    - The recording status will be shown with a timer.
    - Click **Stop** to finish and download the resulting video file.
4.  **Restart Animation**: Use the **Restart Animation** button to clear the chat and replay the sequence from the beginning.

## 🛠 Development Notes

- **Logic Isolation**: Most UI text is centralized in `js/dialogs.js` to separate content from logic.
- **Layout Swapping**: The AI position toggle uses CSS selector logic (e.g., swapping `pl-3` for `pr-3` and changing `flex-direction`) to move the avatar.
- **Recording Quality**: The recorder captures at high bitrate to ensure video assets are production-ready for social media platforms like TikTok or Instagram.
