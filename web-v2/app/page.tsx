"use client";

import { createClient, type Session } from "@supabase/supabase-js";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../lib/api";

type V2App = {
  id: string;
  name: string;
  summary: string;
  deployment_url: string | null;
};

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : null;

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [apps, setApps] = useState<V2App[]>([]);
  const [appsError, setAppsError] = useState("");
  const [appSearch, setAppSearch] = useState("");

  const userEmail = session?.user.email ?? "";

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user.email) {
        setEmail(data.session.user.email);
      }
      setAuthReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user.email) {
        setEmail(nextSession.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userEmail) {
      setApps([]);
      return;
    }

    let cancelled = false;
    setAppsError("");

    void (async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/v2/apps?ownerId=${encodeURIComponent(userEmail)}`), {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Could not load V2 apps");
        }

        const payload = (await response.json()) as { items: V2App[] };
        if (!cancelled) {
          setApps(payload.items);
        }
      } catch (error) {
        if (!cancelled) {
          setAppsError(error instanceof Error ? error.message : "Could not load V2 apps");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const filteredApps = useMemo(() => {
    const query = appSearch.trim().toLowerCase();
    return apps.filter((app) => {
      if (!query) return true;
      return app.name.toLowerCase().includes(query) || app.summary.toLowerCase().includes(query);
    });
  }, [appSearch, apps]);

  async function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setAuthError("Supabase public environment variables are missing.");
      return;
    }
    setAuthBusy(true);
    setAuthError("");

    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setAuthError("Check your email to confirm the account, then log in.");
        }
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || !userEmail || isCreating) return;

    setCreateError("");
    setIsCreating(true);

    try {
      const response = await fetch(buildApiUrl("/api/v2/apps"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: userEmail,
          prompt: trimmed
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        app?: V2App;
      };

      if (!response.ok || !payload.app) {
        throw new Error(payload.error || "Could not create the app.");
      }

      setApps((current) => [payload.app!, ...current.filter((item) => item.id !== payload.app!.id)]);
      setPrompt("");
      if (payload.app.deployment_url) {
        window.location.assign(payload.app.deployment_url);
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not create the app.");
    } finally {
      setIsCreating(false);
    }
  }

  async function signOut() {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    setApps([]);
    setPrompt("");
    setCreateError("");
  }

  if (!authReady) {
    return (
      <main className="page">
        <section className="shell">
          <section className="card hero-card">
            <span className="brand-badge">Pocket Foundry V2</span>
            <h1>Loading</h1>
          </section>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page">
        <section className="shell" style={{ maxWidth: 560 }}>
          <section className="card hero-card stack">
            <span className="brand-badge">Pocket Foundry V2</span>
            <h1>Fresh app build on every prompt.</h1>
            <p>Sign in to create live V2 builds. Each create action publishes a new hosted app URL instead of opening a store template.</p>
          </section>
          <section className="card">
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="segment">
                <button type="button" className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")}>
                  Log In
                </button>
                <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>
                  Create Account
                </button>
              </div>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
              {!supabase ? <p className="error">Supabase public environment variables are missing for this deployment.</p> : null}
              {authError ? <p className="error">{authError}</p> : null}
              <button className="primary-button" type="submit" disabled={authBusy}>
                {authBusy ? "Please wait" : authMode === "signin" ? "Log In" : "Create Account"}
              </button>
            </form>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="shell">
        <header className="top">
          <div className="brand">
            <span className="brand-badge">Pocket Foundry V2</span>
            <h1>Live generated micro apps.</h1>
            <p>Each prompt creates a new hosted endpoint. If the exact request cannot be fulfilled fully, the system still ships the nearest functional build live.</p>
          </div>
          <div className="top-actions">
            <div className="tiny-badge">{userEmail}</div>
            <button className="secondary-button" onClick={() => void signOut()}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="grid">
          <section className="stack">
            <section className="card hero-card">
              <h2>Build A New App</h2>
              <p>Describe the task. V2 will create a new hosted app URL and open it immediately when ready.</p>
            </section>

            <section className="card">
              <form className="create-form" onSubmit={handleCreate}>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: input pdf trim top 1/5 of it fill it with blank space and output"
                />
                {createError ? <p className="error">{createError}</p> : null}
                <button className="primary-button" type="submit" disabled={isCreating}>
                  {isCreating ? "Building live app..." : "Create Live App"}
                </button>
              </form>
            </section>

            <section className="status-box">
              <strong>How V2 behaves</strong>
              <ul className="helper-list">
                <li>Creates a fresh endpoint per prompt.</li>
                <li>Generates a prompt-shaped hosted bundle instead of routing you to a store app.</li>
                <li>Uses the backend capability layer for file processing and saved data when supported.</li>
              </ul>
            </section>
          </section>

          <section className="stack">
            <section className="card">
              <h2>Your V2 Apps</h2>
              <p>Recent generated builds for this account.</p>
              <div style={{ height: 12 }} />
              <input value={appSearch} onChange={(event) => setAppSearch(event.target.value)} placeholder="Search apps" />
            </section>

            {appsError ? <section className="note error">{appsError}</section> : null}

            {filteredApps.length === 0 ? (
              <section className="card empty">
                No V2 apps yet. Create one and it will appear here before the redirect happens.
              </section>
            ) : (
              filteredApps.map((app) => (
                <article className="app-item" key={app.id}>
                  <div className="app-row">
                    <div>
                      <h3>{app.name}</h3>
                      <p>{app.summary}</p>
                    </div>
                    <div className="tiny-badge">#{app.id.slice(0, 8)}</div>
                  </div>
                  <div className="app-actions">
                    {app.deployment_url ? (
                      <a className="primary-button" href={app.deployment_url}>
                        Open
                      </a>
                    ) : (
                      <span className="ghost-button">Missing URL</span>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
