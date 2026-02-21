import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 5.0,
};

export const metadata: Metadata = {
  title: "OpenClaw Office Dashboard",
  description: "Real-time office visualization for OpenClaw sessions and agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap"
        />
        <style>{`
          :root {
            --bg-primary: #d7f7b0;
            --bg-surface: #f6f4cf;
            --bg-sidebar: #cde56f;
            --border-default: #1a2238;
            --border-subtle: #34436e;
            --text-primary: #141b2d;
            --text-secondary: #2d3a63;
            --text-tertiary: #4f5c86;
            --accent-primary: #ff5f2e;
            --accent-hover: #ff8448;
            --font-family: 'Press Start 2P', 'VT323', monospace;
            --font-mono: 'VT323', 'Courier New', monospace;
            --space-xs: 4px;
            --space-sm: 8px;
            --space-md: 12px;
            --space-lg: 16px;
            --space-xl: 20px;
            --space-xxl: 24px;
            --radius-sm: 0px;
            --radius-md: 2px;
            --radius-lg: 4px;
            --shadow-card: 3px 3px 0 0 rgba(20, 27, 45, 0.42);
            --shadow-panel: 5px 5px 0 0 rgba(20, 27, 45, 0.52);
            --shadow-hover: 7px 7px 0 0 rgba(20, 27, 45, 0.62);
            --transition-fast: 120ms steps(2, end);
            --transition-normal: 180ms steps(2, end);
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          body {
            font-family: var(--font-family);
            background-color: var(--bg-primary);
            background-image:
              linear-gradient(rgba(26, 34, 56, 0.14) 1px, transparent 1px),
              linear-gradient(90deg, rgba(26, 34, 56, 0.14) 1px, transparent 1px),
              radial-gradient(circle at 20% 16%, #fff9cf 0%, #d7f7b0 50%, #cde56f 100%);
            background-size: 24px 24px, 24px 24px, 100% 100%;
            color: var(--text-primary);
            image-rendering: pixelated;
            letter-spacing: 0.02em;
            position: relative;
          }

          #__next {
            display: contents;
          }

          body::before {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            opacity: 0.08;
            background: repeating-linear-gradient(
              to bottom,
              rgba(20, 27, 45, 0.9) 0px,
              rgba(20, 27, 45, 0.9) 1px,
              transparent 1px,
              transparent 3px
            );
            z-index: 999;
          }

          @keyframes pixelPulse {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }

          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }

          ::-webkit-scrollbar-track {
            background: var(--bg-surface);
            border: 2px solid var(--border-default);
          }

          ::-webkit-scrollbar-thumb {
            background: var(--accent-primary);
            border: 2px solid var(--border-default);
          }

          ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-hover);
          }

          input,
          textarea {
            border: 2px solid var(--border-default);
            background: var(--bg-surface);
            color: var(--text-primary);
            border-radius: 0;
            box-shadow: var(--shadow-card);
          }

          button {
            border: 2px solid var(--border-default);
            background: var(--accent-primary);
            color: var(--text-primary);
            border-radius: 0;
            box-shadow: var(--shadow-card);
            cursor: pointer;
            transition: transform var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);
          }

          button:hover {
            background: var(--accent-hover);
          }

          button:active {
            transform: translate(2px, 2px);
            box-shadow: 1px 1px 0 0 rgba(20, 27, 45, 0.42);
          }

          input:focus-visible,
          textarea:focus-visible,
          button:focus-visible {
            outline: 2px solid var(--text-primary);
            outline-offset: 2px;
            animation: pixelPulse 0.8s steps(2, end) infinite;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
