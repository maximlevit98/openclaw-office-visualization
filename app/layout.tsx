import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenClaw Office BFF",
  description: "Backend-for-Frontend for OpenClaw Office Visualization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
