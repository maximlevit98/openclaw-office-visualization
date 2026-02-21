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
        <style>{`
          :root {
            /* Base Colors (Warm Neutrals) */
            --bg-primary: #FAF8F5;
            --bg-surface: #FFFFFF;
            --bg-sidebar: #F3F0EB;
            --border-default: #E5E0D8;
            --border-subtle: #EDE9E3;
            --text-primary: #1A1816;
            --text-secondary: #6B635A;
            --text-tertiary: #9E958A;

            /* Status Palette */
            --status-idle: #8B9E7C;
            --status-thinking: #D4A843;
            --status-tool: #5B8ABF;
            --status-error: #C45D4E;
            --status-offline: #B5AFA6;

            /* Accent */
            --accent-primary: #C45A2C;
            --accent-hover: #A8492A;
            --unread-dot: #C45A2C;

            /* Typography */
            --font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            --font-mono: 'JetBrains Mono', 'Monaco', monospace;

            /* Spacing */
            --space-xs: 4px;
            --space-sm: 8px;
            --space-md: 12px;
            --space-lg: 16px;
            --space-xl: 20px;
            --space-xxl: 24px;

            /* Radius */
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 16px;
            --radius-full: 9999px;

            /* Shadows */
            --shadow-card: 0 1px 3px rgba(26, 24, 22, 0.06), 0 1px 2px rgba(26, 24, 22, 0.04);
            --shadow-panel: 0 4px 12px rgba(26, 24, 22, 0.08);
            --shadow-hover: 0 4px 16px rgba(26, 24, 22, 0.12);

            /* Transitions */
            --transition-fast: 150ms ease-out;
            --transition-normal: 200ms ease-in-out;
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
            color: var(--text-primary);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          #__next {
            display: contents;
          }

          /* Animations */
          @keyframes pulse {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          /* Desktop: 3-column layout (280px sidebar | 1fr chat | 300px office) */
          @media (min-width: 1024px) {
            [data-layout="desktop"] {
              display: grid;
              grid-template-columns: 280px 1fr 300px;
              gap: 0;
            }
          }

          /* Tablet: 2-column layout (64px sidebar strip | 1fr chat + top office strip) */
          @media (max-width: 1023px) and (min-width: 768px) {
            [data-layout="tablet"] {
              display: grid;
              grid-template-columns: 64px 1fr;
              gap: 0;
            }

            [data-office-strip] {
              display: flex;
              gap: var(--space-sm);
              overflow-x: auto;
              padding: var(--space-lg);
              border-bottom: 1px solid var(--border-default);
            }
          }

          /* Mobile: deferred */
          @media (max-width: 767px) {
            [data-layout="mobile"] {
              display: flex;
              flex-direction: column;
            }
          }

          /* Scrollbar styling — warm, subtle */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: transparent;
          }

          ::-webkit-scrollbar-thumb {
            background: var(--border-default);
            border-radius: var(--radius-sm);
          }

          ::-webkit-scrollbar-thumb:hover {
            background: var(--text-tertiary);
          }

          /* Form focus styling */
          input:focus,
          textarea:focus {
            outline: none;
            border-color: var(--accent-primary) !important;
            box-shadow: 0 0 0 2px rgba(196, 90, 44, 0.1) !important;
          }

          /* Button focus */
          button:focus {
            outline: 2px solid var(--accent-primary);
            outline-offset: 2px;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
