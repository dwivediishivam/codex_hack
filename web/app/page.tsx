"use client";

import { createClient, type Session } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "Create" | "Apps" | "Guide" | "Store" | "Profile";
type StoreCategory = "All" | "Finance" | "Creative";

type CatalogApp = {
  id: string;
  name: string;
  summary: string;
  detail: string;
  category: Exclude<StoreCategory, "All">;
  prompt: string;
  route: string;
};

type OwnedApp = {
  id: string;
  name: string;
  summary: string;
  prompt: string;
  route: string;
  source: "store" | "created";
};

type CustomAppSpec = {
  id: string;
  name: string;
  summary: string;
  prompt: string;
  focus: string[];
};

type BuildStep = "Thinking" | "Planning" | "Building" | "Finishing";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://hgwcvmkeqammsdblgezf.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd2N2bWtlcWFtbXNkYmxnZXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMTc3MzYsImV4cCI6MjA5MTg5MzczNn0.ZtrDeRwRo02GctrhZyjgl01IR-2dmfc5XeODvPY2dLg"
);

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const tabs: Tab[] = ["Create", "Apps", "Guide", "Store", "Profile"];

const storeCatalog: CatalogApp[] = [
  {
    id: "spend-hours",
    name: "Spend Hours",
    summary: "Turn any price into work hours or life hours.",
    detail: "Set your pay once, choose work time or life time, and see what a purchase really costs.",
    category: "Finance",
    prompt: "Make a small app that shows how many hours of work or life any purchase costs.",
    route: "/micro-apps/spend-hours"
  },
  {
    id: "polaroid-print",
    name: "Polaroid Print",
    summary: "Make instant-film style prints from one or many photos.",
    detail: "Preview one photo, process batches, and export an A4 PDF laid out at print-friendly sizes.",
    category: "Creative",
    prompt: "Make an app that turns photos into print-ready polaroids with a single preview and an A4 batch sheet.",
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user.email) {
        setEmail(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("foundry.tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!userEmail || typeof window === "undefined") {
      setOwnedApps([]);
      return;
    }

    const local = readOwnedApps(userEmail);
    setOwnedApps(local);

    if (!apiBase) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${apiBase}/api/micro-apps?ownerId=${encodeURIComponent(userEmail)}`, {
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          items: Array<{ id: string; name: string; summary: string; deployment_url?: string | null; prompt?: string }>;
        };

        if (cancelled) return;

        const remoteApps = payload.items.map((item) => ({
          id: item.id,
          name: item.name,
          summary: item.summary,
          prompt: item.prompt ?? item.summary,
          route: item.deployment_url || `/micro-apps/custom/${item.id}`,
          source: "created" as const
        }));

        const merged = mergeOwnedApps(local, remoteApps);
        setOwnedApps(merged);
        writeOwnedApps(userEmail, merged);
      } catch {
        // Local fallback remains active for the web shell.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const filteredOwnedApps = useMemo(() => {
    return ownedApps.filter((app) => {
      const query = appSearch.trim().toLowerCase();
      if (!query) return true;
      return app.name.toLowerCase().includes(query) || app.summary.toLowerCase().includes(query);
    });
  }, [appSearch, ownedApps]);

  const filteredStoreApps = useMemo(() => {
    return storeCatalog.filter((app) => {
      const categoryMatch = storeCategory === "All" || app.category === storeCategory;
      const query = storeSearch.trim().toLowerCase();
      const searchMatch =
        !query || app.name.toLowerCase().includes(query) || app.summary.toLowerCase().includes(query);
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
    if (!trimmed || !userEmail) return;

    setIsCreating(true);
    setBuildStep("Thinking");
    await wait(500);
    setBuildStep("Planning");
    await wait(700);
    setBuildStep("Building");

    const spec = buildCustomAppSpec(trimmed);
    const ownedApp: OwnedApp = {
      id: spec.id,
      name: spec.name,
      summary: spec.summary,
      prompt: spec.prompt,
      route: `/micro-apps/custom/${spec.id}`,
      source: "created"
    };

    storeCustomSpec(spec);

    if (apiBase) {
      try {
        await fetch(`${apiBase}/api/micro-apps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId: userEmail,
            name: spec.name,
            prompt: spec.prompt,
            visibility: "private",
            audience: "personal",
            category: "custom",
            generationMode: "instant"
          })
        });
      } catch {
        // The web shell still keeps a local deployed route even when the API is unavailable.
      }
    }

    await wait(800);
    setBuildStep("Finishing");
    await wait(500);

    const updated = mergeOwnedApps(ownedApps, [ownedApp]);
    setOwnedApps(updated);
    writeOwnedApps(userEmail, updated);
    setPrompt("");
    setActiveTab("Apps");
    setIsCreating(false);
  }

  function addStoreApp(app: CatalogApp) {
    if (!userEmail) return;

    const ownedApp: OwnedApp = {
      id: app.id,
      name: app.name,
      summary: app.summary,
      prompt: app.prompt,
      route: app.route,
      source: "store"
    };

    const updated = mergeOwnedApps(ownedApps, [ownedApp]);
    setOwnedApps(updated);
    writeOwnedApps(userEmail, updated);
    setActiveTab("Apps");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setOwnedApps([]);
    setPrompt("");
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
                    <span>Your app will appear in Apps when the build completes.</span>
                  </div>
                ) : null}
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

              {filteredOwnedApps.length == 0 ? (
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
                      <Link className="primary-button inline" href={app.route}>
                        Open
                      </Link>
                      <button
                        className="secondary-button inline"
                        onClick={() => {
                          setPrompt(`Update ${app.name}: ${app.prompt}`);
                          setActiveTab("Create");
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </article>
                ))
              )}
            </>
          )}

          {activeTab === "Guide" && (
            <section className="stack-list">
              <article className="panel guide-panel">
                <h3>What this app is</h3>
                <p>Foundry is for small apps with one clear job. Build your own or save one from the store.</p>
              </article>
              <article className="panel guide-panel">
                <h3>Create</h3>
                <p>Write one direct prompt. Foundry turns it into a personal app and adds it to your Apps tab.</p>
              </article>
              <article className="panel guide-panel">
                <h3>Apps</h3>
                <p>Your Apps tab only shows apps you created or added for yourself.</p>
              </article>
              <article className="panel guide-panel">
                <h3>Store</h3>
                <p>The store holds polished starter apps that you can open or save into your own workspace.</p>
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
                    <Link className="primary-button inline" href={app.route}>
                      Open
                    </Link>
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

function buildCustomAppSpec(prompt: string): CustomAppSpec {
  const name = deriveTitle(prompt);
  const summary = deriveSummary(prompt);
  const focus = deriveFocus(prompt);

  return {
    id: crypto.randomUUID(),
    name,
    summary,
    prompt,
    focus
  };
}

function deriveTitle(prompt: string) {
  const stopWords = new Set([
    "make",
    "build",
    "create",
    "me",
    "my",
    "i",
    "want",
    "need",
    "to",
    "into",
    "for",
    "with",
    "a",
    "an",
    "the",
    "app"
  ]);

  const tokens = prompt
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !stopWords.has(token.toLowerCase()))
    .slice(0, 3)
    .map((token) => token[0].toUpperCase() + token.slice(1).toLowerCase());

  return tokens.join(" ") || "New App";
}

function deriveSummary(prompt: string) {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 88) return cleaned;
  return `${cleaned.slice(0, 85).trim()}...`;
}

function deriveFocus(prompt: string) {
  const parts = prompt
    .split(/,| and | with /i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);

  return parts.length > 0 ? parts : ["One clear workflow", "Simple input", "A result screen"];
}

function readOwnedApps(email: string): OwnedApp[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(`foundry.owned.${email}`);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as OwnedApp[];
  } catch {
    return [];
  }
}

function writeOwnedApps(email: string, apps: OwnedApp[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`foundry.owned.${email}`, JSON.stringify(apps));
}

function mergeOwnedApps(base: OwnedApp[], incoming: OwnedApp[]) {
  const map = new Map<string, OwnedApp>();
  [...base, ...incoming].forEach((app) => {
    map.set(app.id, app);
  });
  return [...map.values()];
}

function storeCustomSpec(spec: CustomAppSpec) {
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem("foundry.customApps");
  const current = raw ? ((JSON.parse(raw) as CustomAppSpec[]) ?? []) : [];
  const next = [spec, ...current.filter((item) => item.id !== spec.id)];
  window.localStorage.setItem("foundry.customApps", JSON.stringify(next));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
