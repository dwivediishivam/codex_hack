"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Visibility = "Private" | "Public" | "Org";
type Category = "Planner" | "Finance" | "Event" | "Operations" | "Custom";
type Tab = "Apps" | "Create" | "Guide" | "Store" | "Profile";

type AppCard = {
  name: string;
  summary: string;
  visibility: Visibility;
  category: Category;
  status: string;
  saves: number;
  prompt: string;
  url: string;
};

type RemoteAppRecord = {
  name: string;
  summary: string;
  visibility: "private" | "public" | "organization";
  category: string;
  status: string;
  deploymentUrl?: string | null;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const tabs: Tab[] = ["Apps", "Create", "Guide", "Store", "Profile"];

const sampleApps: AppCard[] = [
  {
    name: "Spend Hours",
    summary: "See what a purchase costs in working hours.",
    visibility: "Public",
    category: "Finance",
    status: "Ready",
    saves: 312,
    prompt: "Make me a small app that shows how many work hours I need for any purchase before I spend.",
    url: "/micro-apps/spend-hours"
  },
  {
    name: "Guest Desk",
    summary: "Simple guest check-in for small events.",
    visibility: "Public",
    category: "Event",
    status: "Ready",
    saves: 196,
    prompt: "Build a tiny event check-in app with guest status, VIP notes, and a live capacity count.",
    url: "/micro-apps/guest-desk"
  },
  {
    name: "Renewal Radar",
    summary: "Track renewals, owners, and keep or cancel calls.",
    visibility: "Org",
    category: "Operations",
    status: "In Review",
    saves: 21,
    prompt: "Create a renewal tracker for our team with owners, decision dates, and a keep or cancel note.",
    url: "/micro-apps/renewal-radar"
  },
  {
    name: "Brief Deck",
    summary: "Capture priorities, blockers, and timings for the day.",
    visibility: "Private",
    category: "Planner",
    status: "Building",
    saves: 4,
    prompt: "Make a daily brief app with priorities, blockers, schedule, and decision log for a small team.",
    url: "/micro-apps/brief-deck"
  },
  {
    name: "Polaroid Print",
    summary: "Take photos and prepare polaroids for A4 or A3 print sheets.",
    visibility: "Public",
    category: "Custom",
    status: "Ready",
    saves: 119,
    prompt: "Make an app that takes pictures and outputs polaroids in different sizes with A4 and A3 print sheets.",
    url: "/micro-apps/polaroid-print"
  }
];

export default function HomePage() {
  const [signedIn, setSignedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Apps");
  const [prompt, setPrompt] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Private");
  const [category, setCategory] = useState<Category>("Planner");
  const [apps, setApps] = useState<AppCard[]>(sampleApps);
  const [storeApps, setStoreApps] = useState<AppCard[]>(sampleApps.filter((app) => app.visibility === "Public"));
  const [appSearch, setAppSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [appFilter, setAppFilter] = useState<Visibility | "All">("All");
  const [storeFilter, setStoreFilter] = useState<Category | "All">("All");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedSignedIn = window.localStorage.getItem("foundry.signedIn");
    const savedEmail = window.localStorage.getItem("foundry.email");
    const savedTab = window.localStorage.getItem("foundry.tab") as Tab | null;

    if (savedSignedIn == "true") {
      setSignedIn(true);
    }

    if (savedEmail) {
      setEmail(savedEmail);
    }

    if (savedTab && tabs.includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("foundry.signedIn", String(signedIn));
    window.localStorage.setItem("foundry.email", email);
    window.localStorage.setItem("foundry.tab", activeTab);
  }, [signedIn, email, activeTab]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!apiBase) return;

      try {
        const [appsResponse, publicResponse] = await Promise.all([
          fetch(`${apiBase}/api/micro-apps?ownerId=${encodeURIComponent(email || "web-demo-user")}`, { cache: "no-store" }),
          fetch(`${apiBase}/api/micro-apps/public`, { cache: "no-store" })
        ]);

        if (!appsResponse.ok || !publicResponse.ok) return;

        const appsPayload = (await appsResponse.json()) as { items: RemoteAppRecord[] };
        const publicPayload = (await publicResponse.json()) as { items: RemoteAppRecord[] };

        if (cancelled) return;

        if (appsPayload.items.length > 0) {
          setApps(appsPayload.items.map(mapRemoteApp));
        }

        if (publicPayload.items.length > 0) {
          setStoreApps(publicPayload.items.map(mapRemoteApp));
        }
      } catch {
        // Keep local sample state when API is not available.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const filterMatch = appFilter === "All" || app.visibility === appFilter;
      const searchMatch =
        appSearch.length === 0 ||
        app.name.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.summary.toLowerCase().includes(appSearch.toLowerCase());
      return filterMatch && searchMatch;
    });
  }, [appFilter, appSearch, apps]);

  const filteredStore = useMemo(() => {
    return storeApps.filter((app) => {
      const filterMatch = storeFilter === "All" || app.category === storeFilter;
      const searchMatch =
        storeSearch.length === 0 ||
        app.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
        app.summary.toLowerCase().includes(storeSearch.toLowerCase());
      return filterMatch && searchMatch;
    });
  }, [storeApps, storeFilter, storeSearch]);

  function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setSignedIn(true);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;

    if (!apiBase) {
      const local = buildLocalApp(prompt, visibility, category);
      setApps((current) => [local, ...current.filter((item) => item.name !== local.name)]);
      if (local.visibility === "Public") {
        setStoreApps((current) => [local, ...current.filter((item) => item.name !== local.name)]);
      }
      setActiveTab("Apps");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/micro-apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: email || "web-demo-user",
          name: deriveTitle(prompt),
          prompt,
          visibility: visibility === "Org" ? "organization" : visibility.toLowerCase(),
          audience: visibility === "Org" ? "team" : visibility === "Public" ? "consumer" : "personal",
          category: category.toLowerCase(),
          generationMode: "instant"
        })
      });

      const payload = await response.json();
      if (!response.ok) return;

      const created = mapRemoteApp(payload.app as RemoteAppRecord);
      setApps((current) => [created, ...current.filter((item) => item.name !== created.name)]);
      if (created.visibility === "Public") {
        setStoreApps((current) => [created, ...current.filter((item) => item.name !== created.name)]);
      }
      setPrompt("");
      setActiveTab("Apps");
    } catch {
      // Silent fallback for the shell.
    }
  }

  if (!signedIn) {
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
            <button className="primary-button" type="submit">
              {authMode === "signin" ? "Log In" : "Create Account"}
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
          <span>{StudioHeader(activeTab)}</span>
        </header>

        <section className="content-stack">
          {activeTab === "Apps" && (
            <>
              <input
                className="search-input"
                value={appSearch}
                onChange={(event) => setAppSearch(event.target.value)}
                placeholder="Search apps"
              />
              <div className="chip-row">
                {(["All", "Private", "Public", "Org"] as const).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`chip-button ${appFilter === item ? "active" : ""}`}
                    onClick={() => setAppFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {filteredApps.map((app) => (
                <article className="panel app-row" key={app.name}>
                  <div>
                    <h3>{app.name}</h3>
                    <p>{app.summary}</p>
                  </div>
                  <div className="chip-row compact">
                    <span className="chip">{app.visibility}</span>
                    <span className="chip">{app.status}</span>
                  </div>
                  <div className="row">
                    <a className="primary-button inline" href={app.url}>
                      Open
                    </a>
                    <button
                      className="secondary-button inline"
                      onClick={() => {
                        setPrompt(`Update ${app.name}: `);
                        setVisibility(app.visibility);
                        setCategory(app.category);
                        setActiveTab("Create");
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </article>
              ))}
            </>
          )}

          {activeTab === "Create" && (
            <section className="create-screen">
              <form className="create-card" onSubmit={handleCreate}>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe the app"
                />
                <div className="chip-row center">
                  {(["Private", "Public", "Org"] as Visibility[]).map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`chip-button ${visibility === item ? "active" : ""}`}
                      onClick={() => setVisibility(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="chip-row center">
                  {(["Planner", "Finance", "Event", "Operations", "Custom"] as Category[]).map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`chip-button ${category === item ? "active" : ""}`}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <button className="primary-button" type="submit">
                  Create
                </button>
              </form>
            </section>
          )}

          {activeTab === "Guide" && (
            <section className="stack-list">
              {["Write one clear prompt.", "Pick where it lives.", "Create the app.", "Open it or edit it."].map((item) => (
                <article className="panel line-row" key={item}>
                  <span>{item}</span>
                </article>
              ))}
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
              <div className="chip-row">
                {(["All", "Planner", "Finance", "Event", "Operations", "Custom"] as const).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`chip-button ${storeFilter === item ? "active" : ""}`}
                    onClick={() => setStoreFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {filteredStore.map((app) => (
                <article className="panel app-row" key={app.name}>
                  <div>
                    <h3>{app.name}</h3>
                    <p>{app.summary}</p>
                  </div>
                  <div className="chip-row compact">
                    <span className="chip">{app.category}</span>
                    <span className="chip">{app.saves} saves</span>
                  </div>
                  <div className="row">
                    <a className="primary-button inline" href={app.url}>
                      Open
                    </a>
                    <button
                      className="secondary-button inline"
                      onClick={() => {
                        setPrompt(app.prompt);
                        setCategory(app.category);
                        setVisibility("Private");
                        setActiveTab("Create");
                      }}
                    >
                      Remix
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
                <strong>{email || "demo@foundry.app"}</strong>
              </article>
              <article className="panel line-row">
                <span>Apps</span>
                <strong>{apps.length}</strong>
              </article>
              <article className="panel line-row">
                <span>Public</span>
                <strong>{storeApps.length}</strong>
              </article>
              <button
                className="secondary-button"
                onClick={() => {
                  setSignedIn(false);
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem("foundry.signedIn");
                    window.localStorage.removeItem("foundry.tab");
                  }
                }}
              >
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

function mapRemoteApp(record: RemoteAppRecord): AppCard {
  const template = sampleApps.find((item) => item.name.toLowerCase() === record.name.toLowerCase());

  return {
    name: record.name,
    summary: record.summary,
    visibility: mapVisibility(record.visibility),
    category: mapCategory(record.category),
    status: mapStatus(record.status),
    saves: template?.saves ?? 0,
    prompt: template?.prompt ?? record.summary,
    url: record.deploymentUrl || template?.url || `/micro-apps/${slugify(record.name)}`
  };
}

function mapVisibility(value: RemoteAppRecord["visibility"]): Visibility {
  if (value === "public") return "Public";
  if (value === "organization") return "Org";
  return "Private";
}

function mapCategory(value: string): Category {
  const lowered = value.toLowerCase();
  if (lowered === "finance") return "Finance";
  if (lowered === "event") return "Event";
  if (lowered === "operations") return "Operations";
  if (lowered === "custom") return "Custom";
  return "Planner";
}

function mapStatus(value: string) {
  if (value.toLowerCase() === "ready") return "Ready";
  if (value.toLowerCase() === "reviewing") return "In Review";
  if (value.toLowerCase() === "failed") return "Needs Fix";
  return "Building";
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
    "before",
    "after",
    "this",
    "it",
    "any",
    "one",
    "a",
    "an",
    "the",
    "app",
    "small",
    "tiny",
    "for",
    "with",
    "our",
    "that",
    "should",
    "can",
    "would"
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

function buildLocalApp(prompt: string, visibility: Visibility, category: Category): AppCard {
  const name = deriveTitle(prompt);
  return {
    name,
    summary: prompt,
    visibility,
    category,
    status: visibility === "Public" ? "In Review" : "Building",
    saves: 0,
    prompt,
    url: `/micro-apps/${slugify(name)}`
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function StudioHeader(tab: Tab) {
  if (tab === "Create") return "Create";
  if (tab === "Guide") return "Guide";
  if (tab === "Store") return "Store";
  if (tab === "Profile") return "Profile";
  return "Apps";
}
