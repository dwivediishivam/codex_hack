"use client";

import { FormEvent, useMemo, useState } from "react";

const privateApps = [
  {
    name: "Spend Hours",
    status: "Ready",
    summary: "Convert purchases into work-hours before spending."
  },
  {
    name: "Renewal Radar",
    status: "Building",
    summary: "Track renewals, owners, and underused tools."
  }
];

const publicApps = [
  {
    name: "Trip Splitter",
    tagline: "A better shared-cost tracker for small groups.",
    saves: 209
  },
  {
    name: "Campus Sprint",
    tagline: "Run student events with a clean mobile command board.",
    saves: 488
  }
];

export default function HomePage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("This web app mirrors the Swift shell and will share Supabase auth and backend APIs.");

  const metrics = useMemo(
    () => [
      { label: "Private apps", value: "12" },
      { label: "Org spaces", value: "3" },
      { label: "Prompt edits", value: "Live" }
    ],
    []
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(`${authMode === "signin" ? "Sign in" : "Account creation"} will run through Supabase Auth. Prompt draft: ${prompt || "not provided yet"}`);
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="eyebrow">CODEX HACK</div>
        <h1>One mobile-first shell for AI-generated micro apps.</h1>
        <p>
          Private tools, public utilities, and organization workspaces delivered through a single
          governed platform.
        </p>
        <div className="metric-row">
          {metrics.map((metric) => (
            <div className="metric-pill" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="stack">
        <article className="glass-card">
          <div className="section-eyebrow">Access</div>
          <h2>Email and password auth</h2>
          <p>Supabase Auth is the shared identity layer for the Swift app and this mobile web replica.</p>

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="segmented">
              <button type="button" data-active={authMode === "signin"} onClick={() => setAuthMode("signin")}>
                Sign In
              </button>
              <button type="button" data-active={authMode === "signup"} onClick={() => setAuthMode("signup")}>
                Create Account
              </button>
            </div>

            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the micro app you want live..." />
            <button className="primary-button" type="submit">
              {authMode === "signin" ? "Continue" : "Create Account"}
            </button>
          </form>

          <div className="helper-text">{message}</div>
        </article>

        <article className="glass-card dark-card">
          <div className="section-eyebrow">Workspace</div>
          <h2>Swift shell, mirrored for the web</h2>
          <p>Status-first cards, compact summaries, and mobile scanability stay consistent across both clients.</p>
          <div className="app-stack">
            {privateApps.map((app) => (
              <div className="mini-card" key={app.name}>
                <div className="mini-header">
                  <strong>{app.name}</strong>
                  <span>{app.status}</span>
                </div>
                <p>{app.summary}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="glass-card">
        <div className="section-eyebrow">Public Store</div>
        <h2>Public apps worth remixing</h2>
        <div className="store-list">
          {publicApps.map((app) => (
            <div className="store-item" key={app.name}>
              <div>
                <strong>{app.name}</strong>
                <p>{app.tagline}</p>
              </div>
              <span>{app.saves} saves</span>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .page-shell {
          max-width: 460px;
          margin: 0 auto;
          padding: 18px 16px 48px;
          display: grid;
          gap: 16px;
        }
        .hero-card,
        .glass-card {
          border-radius: 28px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.76);
          backdrop-filter: blur(14px);
          box-shadow: 0 18px 40px rgba(14, 39, 35, 0.08);
          padding: 20px;
        }
        .hero-card {
          background: linear-gradient(145deg, #142128, #175857, #12a388);
          color: white;
        }
        .eyebrow,
        .section-eyebrow {
          margin-bottom: 8px;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.8;
        }
        h1,
        h2,
        p {
          margin: 0;
        }
        h1 {
          font-size: 34px;
          line-height: 1.02;
          margin-bottom: 10px;
        }
        h2 {
          font-size: 24px;
          line-height: 1.1;
          margin-bottom: 10px;
        }
        p {
          color: rgba(255, 255, 255, 0.84);
        }
        .glass-card p,
        .helper-text,
        .store-item p {
          color: var(--muted);
        }
        .stack,
        .metric-row,
        .app-stack,
        .store-list,
        .auth-form {
          display: grid;
          gap: 12px;
        }
        .metric-row {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 18px;
        }
        .metric-pill {
          padding: 12px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.16);
          display: grid;
          gap: 2px;
        }
        .metric-pill strong {
          font-size: 18px;
        }
        .metric-pill span {
          color: rgba(255,255,255,0.74);
          font-size: 12px;
        }
        .segmented {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 6px;
          border-radius: 18px;
          background: rgba(17,25,38,0.05);
        }
        .segmented button,
        .primary-button {
          border: 0;
          border-radius: 14px;
          padding: 14px 16px;
        }
        .segmented button {
          color: var(--muted);
          background: transparent;
        }
        .segmented button[data-active="true"] {
          background: white;
          color: var(--ink);
          box-shadow: 0 6px 16px rgba(17,25,38,0.08);
        }
        input,
        textarea {
          width: 100%;
          border: 1px solid rgba(17,25,38,0.08);
          border-radius: 18px;
          padding: 15px 16px;
          background: rgba(255,255,255,0.82);
          outline: none;
        }
        textarea {
          min-height: 120px;
          resize: vertical;
        }
        .primary-button {
          background: var(--accent-dark);
          color: white;
          font-weight: 700;
        }
        .dark-card {
          background: linear-gradient(180deg, rgba(16,46,50,0.97), rgba(25,78,75,0.92));
          color: white;
        }
        .dark-card p {
          color: rgba(255,255,255,0.76);
        }
        .mini-card,
        .store-item {
          border-radius: 20px;
          padding: 14px;
        }
        .mini-card {
          background: rgba(255,255,255,0.08);
        }
        .mini-header,
        .store-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .store-item {
          align-items: center;
          background: rgba(255,255,255,0.62);
        }
        .store-item span {
          white-space: nowrap;
          color: var(--accent-dark);
          font-size: 13px;
          font-weight: 700;
        }
        .helper-text {
          font-size: 14px;
        }
      `}</style>
    </main>
  );
}
