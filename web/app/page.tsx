"use client";

import { createClient, type Session } from "@supabase/supabase-js";
import Link from "next/link";
import { type ReactNode, FormEvent, useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../lib/api";

type Tab = "Create" | "Apps" | "Guide" | "Store" | "Profile";
type StoreCategory = "All" | "Finance" | "Creative";
type BuildStep = "Thinking" | "Planning" | "Building" | "Finishing";

type CatalogApp = {
  id: string;
  name: string;
  summary: string;
  detail: string;
  category: Exclude<StoreCategory, "All">;
  route: string;
};

type OwnedApp = {
  id: string;
  name: string;
  summary: string;
  route: string;
  source: "store" | "created";
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

const tabs: Tab[] = ["Create", "Apps", "Guide", "Store", "Profile"];

const storeCatalog: CatalogApp[] = [
  {
    id: "spend-hours",
    name: "Spend Hours",
    summary: "Turn any price into work hours or life hours.",
    detail: "Set your pay once, choose work time or life time, and see what a purchase really costs.",
    category: "Finance",
    route: "/micro-apps/spend-hours"
  },
  {
    id: "polaroid-print",
    name: "Polaroid Print",
    summary: "Make instant-film style prints from one or many photos.",
    detail: "Preview one photo, process batches, and export an A4 PDF laid out at print-friendly sizes.",
    category: "Creative",
    route: "/micro-apps/polaroid-print"
  }
];

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Create");
  const [prompt, setPrompt] = useState("");
  const [createError, setCreateError] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeCategory, setStoreCategory] = useState<StoreCategory>("All");
  const [ownedApps, setOwnedApps] = useState<OwnedApp[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [buildStep, setBuildStep] = useState<BuildStep>("Thinking");

  const userEmail = session?.user.email ?? "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = window.localStorage.getItem("foundry.tab") as Tab | null;
      if (savedTab && tabs.includes(savedTab)) {
        setActiveTab(savedTab);
      }
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
    if (typeof window === "undefined") return;
    window.localStorage.setItem("foundry.tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!userEmail) {
      setOwnedApps([]);
      return;
    }

    const localStoreApps = readStoreApps(userEmail);
    setOwnedApps(localStoreApps);

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/micro-apps?ownerId=${encodeURIComponent(userEmail)}`), {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Could not load apps");
        }

        const payload = (await response.json()) as {
          items: Array<{ id: string; name: string; summary: string; deployment_url?: string | null }>;
        };

        if (cancelled) return;

        const remoteApps = payload.items.map((item) => ({
          id: item.id,
          name: item.name,
          summary: item.summary,
          route: item.deployment_url || `/micro-apps/custom/${item.id}`,
          source: "created" as const
        }));

        setOwnedApps(mergeOwnedApps(localStoreApps, remoteApps));
      } catch {
        if (!cancelled) {
          setOwnedApps(localStoreApps);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const filteredOwnedApps = useMemo(() => {
    const query = appSearch.trim().toLowerCase();
    return ownedApps.filter((app) => {
      if (!query) return true;
      return app.name.toLowerCase().includes(query) || app.summary.toLowerCase().includes(query);
    });
  }, [appSearch, ownedApps]);

  const filteredStoreApps = useMemo(() => {
    return storeCatalog.filter((app) => {
      const categoryMatch = storeCategory === "All" || app.category === storeCategory;
      const query = storeSearch.trim().toLowerCase();
      const searchMatch = !query || app.name.toLowerCase().includes(query) || app.summary.toLowerCase().includes(query);
      return categoryMatch && searchMatch;
    });
  }, [storeCategory, storeSearch]);

  async function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
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
    setBuildStep("Thinking");

    const interval = window.setInterval(() => {
      setBuildStep((current) => nextBuildStep(current));
    }, 900);

    try {
      const response = await fetch(buildApiUrl("/api/micro-apps"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: userEmail,
          prompt: trimmed
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        app?: { id: string; name: string; summary: string; deployment_url?: string | null };
      };

      if (!response.ok || !payload.app) {
        throw new Error(payload.error || "Could not create the app.");
      }

      const ownedApp: OwnedApp = {
        id: payload.app.id,
        name: payload.app.name,
        summary: payload.app.summary,
        route: payload.app.deployment_url || `/micro-apps/custom/${payload.app.id}`,
        source: "created"
      };

      setOwnedApps((current) => mergeOwnedApps(current, [ownedApp]));
      setPrompt("");
      setActiveTab("Apps");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not create the app.");
    } finally {
      window.clearInterval(interval);
      setBuildStep("Finishing");
      window.setTimeout(() => {
        setIsCreating(false);
        setBuildStep("Thinking");
      }, 350);
    }
  }

  function addStoreApp(app: CatalogApp) {
    if (!userEmail) return;

    const ownedApp: OwnedApp = {
      id: app.id,
      name: app.name,
      summary: app.summary,
      route: app.route,
      source: "store"
    };

    const updated = mergeOwnedApps(ownedApps, [ownedApp]);
    setOwnedApps(updated);
    writeStoreApps(userEmail, updated.filter((item) => item.source === "store"));
    setActiveTab("Apps");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setOwnedApps([]);
    setPrompt("");
    setCreateError("");
    setActiveTab("Create");
  }

  if (!authReady) {
    return (
      <main className="shell auth-shell">
        <section className="auth-card">
          <img src="/logo.png" alt="Foundry logo" className="brand-mark large" />
          <div className="loader-card">
            <div className="loader-bar">
              <span className="loader-fill step-building" />
            </div>
            <strong>Loading</strong>
          </div>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="shell auth-shell">
        <section className="auth-card">
          <img src="/logo.png" alt="Foundry logo" className="brand-mark large" />
          <h1>Foundry</h1>
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="segmented">
              <button
                type="button"
                className={authMode === "signin" ? "active" : ""}
                onClick={() => setAuthMode("signin")}
              >
                Log In
              </button>
              <button
                type="button"
                className={authMode === "signup" ? "active" : ""}
                onClick={() => setAuthMode("signup")}
              >
                Create Account
              </button>
            </div>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
            />
            {authError ? <p className="auth-error">{authError}</p> : null}
            <button className="primary-button" type="submit" disabled={authBusy}>
              {authBusy ? "Please wait" : authMode === "signin" ? "Log In" : "Create Account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="phone-frame">
        <header className="top-bar">
          <img src="/logo.png" alt="Foundry logo" className="brand-mark" />
          <span>{activeTab}</span>
        </header>

        <section className="content-stack">
          {activeTab === "Create" && (
            <section className="create-screen">
              <form className="create-card" onSubmit={handleCreate}>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe the app you want"
                />
                <button className="primary-button" type="submit" disabled={isCreating}>
                  {isCreating ? "Building..." : "Create App"}
                </button>
                {isCreating ? (
                  <div className="loader-card">
                    <div className="loader-bar">
                      <span className={`loader-fill step-${buildStep.toLowerCase()}`} />
                    </div>
                    <strong>{buildStep}</strong>
                    <span>Your app will appear in Apps when it is ready.</span>
                  </div>
                ) : null}
                {createError ? <p className="auth-error">{createError}</p> : null}
              </form>
            </section>
          )}

          {activeTab === "Apps" && (
            <>
              <input
                className="search-input"
                value={appSearch}
                onChange={(event) => setAppSearch(event.target.value)}
                placeholder="Search your apps"
              />

              {filteredOwnedApps.length === 0 ? (
                <section className="panel empty-panel">
                  <h3>No apps yet</h3>
                  <p>Create one or add one from the store.</p>
                </section>
              ) : (
                filteredOwnedApps.map((app) => (
                  <article className="panel app-row" key={app.id}>
                    <div>
                      <h3>{app.name}</h3>
                      <p>{app.summary}</p>
                    </div>
                    <div className="row">
                      <AppLink className="primary-button inline" href={app.route}>
                        Open
                      </AppLink>
                      {app.source === "created" ? (
                        <button
                          className="secondary-button inline"
                          onClick={() => {
                            setPrompt(`Refine ${app.name} so it handles one more workflow cleanly.`);
                            setActiveTab("Create");
                          }}
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </>
          )}

          {activeTab === "Guide" && (
            <section className="stack-list">
              <article className="panel guide-panel">
                <h3>What Foundry does</h3>
                <p>Foundry turns a short prompt into a small app built for one exact job.</p>
              </article>
              <article className="panel guide-panel">
                <h3>How to use it</h3>
                <p>Write the task clearly, create the app, then open it from Apps and use it immediately.</p>
              </article>
              <article className="panel guide-panel">
                <h3>What belongs here</h3>
                <p>Personal tools, event helpers, trackers, calculators, and focused workflows work best.</p>
              </article>
            </section>
          )}

          {activeTab === "Store" && (
            <>
              <input
                className="search-input"
                value={storeSearch}
                onChange={(event) => setStoreSearch(event.target.value)}
                placeholder="Search store"
              />
              <div className="segmented store-filter">
                {(["All", "Finance", "Creative"] as const).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={storeCategory === item ? "active" : ""}
                    onClick={() => setStoreCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {filteredStoreApps.map((app) => (
                <article className="panel app-row" key={app.id}>
                  <div>
                    <h3>{app.name}</h3>
                    <p>{app.summary}</p>
                    <small>{app.detail}</small>
                  </div>
                  <div className="row">
                    <AppLink className="primary-button inline" href={app.route}>
                      Open
                    </AppLink>
                    <button className="secondary-button inline" onClick={() => addStoreApp(app)}>
                      Add
                    </button>
                  </div>
                </article>
              ))}
            </>
          )}

          {activeTab === "Profile" && (
            <section className="stack-list">
              <article className="panel line-row">
                <span>Email</span>
                <strong>{userEmail}</strong>
              </article>
              <article className="panel line-row">
                <span>Your apps</span>
                <strong>{ownedApps.length}</strong>
              </article>
              <article className="panel line-row">
                <span>Store apps</span>
                <strong>{storeCatalog.length}</strong>
              </article>
              <button className="secondary-button" onClick={() => void signOut()}>
                Sign Out
              </button>
            </section>
          )}
        </section>

        <nav className="bottom-nav" aria-label="Primary">
          {tabs.map((tab) => (
            <button key={tab} className={`nav-item ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

function nextBuildStep(step: BuildStep): BuildStep {
  if (step === "Thinking") return "Planning";
  if (step === "Planning") return "Building";
  if (step === "Building") return "Finishing";
  return "Building";
}

function readStoreApps(email: string): OwnedApp[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(`foundry.store.${email}`);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as OwnedApp[];
  } catch {
    return [];
  }
}

function writeStoreApps(email: string, apps: OwnedApp[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`foundry.store.${email}`, JSON.stringify(apps));
}

function AppLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function mergeOwnedApps(base: OwnedApp[], incoming: OwnedApp[]) {
  const map = new Map<string, OwnedApp>();
  [...base, ...incoming].forEach((app) => {
    map.set(app.id, app);
  });
  return [...map.values()];
}
