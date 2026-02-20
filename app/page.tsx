export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>OpenClaw Office BFF</h1>
      <p>Backend-for-Frontend gateway adapter running.</p>

      <section style={{ marginTop: "2rem" }}>
        <h2>API Endpoints</h2>
        <ul>
          <li>
            <code>GET /api/sessions</code> — List all sessions
          </li>
          <li>
            <code>GET /api/sessions/[key]/history</code> — Session history
          </li>
          <li>
            <code>POST /api/sessions/[key]/send</code> — Send message
          </li>
          <li>
            <code>GET /api/agents</code> — List agents
          </li>
          <li>
            <code>GET /api/stream</code> — SSE stream (stub)
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Setup</h2>
        <p>
          1. Copy <code>.env.example</code> to <code>.env.local</code>
        </p>
        <p>2. Set GATEWAY_TOKEN from: openclaw gateway status</p>
        <p>3. Run: npm install && npm run dev</p>
      </section>
    </main>
  );
}
