"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Visibility = "Private" | "Public" | "Org";
type Category = "Planner" | "Finance" | "Event" | "Operations";
type Tab = "Home" | "Build" | "Store" | "Teams" | "Account";

type AppCard = {
  name: string;
  tagline: string;
  summary: string;
  storeNote: string;
  visibility: Visibility;
  category: Category;
  status: string;
  saves: number;
  runs: number;
  progress: number;
  samplePrompt: string;
};

type RemoteAppRecord = {
  id: string;
  name: string;
  summary: string;
  visibility: "private" | "public" | "organization";
  audience: string;
  category: string;
  generationMode: string;
  status: string;
  deploymentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const sampleApps: AppCard[] = [
  {
    name: "Spend Hours",
    tagline: "See what a purchase costs in working hours.",
    summary:
      "Turn any item into hours of work, compare impulse buys against planned spending, and keep a calmer view of what something really costs.",
    storeNote: "A strong public utility because the concept is universal and easy to understand in seconds.",
    visibility: "Public",
    category: "Finance",
    status: "Ready",
    saves: 312,
    runs: 942,
    progress: 100,
    samplePrompt:
      "Make me a small app that shows how many work hours I need for any purchase before I spend."
  },
  {
    name: "Guest Desk",
    tagline: "A simple arrival board for small events.",
    summary:
      "Check guests in, mark VIP notes, track capacity, and keep one calm screen for the people at the door.",
    storeNote: "A useful public template for campus events, pop-ups, launches, and private gatherings.",
    visibility: "Public",
    category: "Event",
    status: "Ready",
    saves: 196,
    runs: 508,
    progress: 100,
    samplePrompt:
      "Build a tiny event check-in app with guest status, VIP notes, and a live capacity count."
  },
  {
    name: "Renewal Radar",
    tagline: "Track renewals, owners, and stop-or-keep calls.",
    summary:
      "A shared operations app for software renewals with owners, renewal dates, usage notes, and a clear keep or cancel decision.",
    storeNote: "Best used as an organization app where finance and ops need the same source of truth.",
    visibility: "Org",
    category: "Operations",
    status: "In Review",
    saves: 21,
    runs: 68,
    progress: 84,
    samplePrompt:
      "Create a renewal tracker for our team with owners, decision dates, and a keep or cancel note."
  },
  {
    name: "Brief Deck",
    tagline: "One quiet screen for the day ahead.",
    summary:
      "Capture today’s priorities, blockers, key timings, and decisions for a small team, event crew, or project room.",
    storeNote: "A good private default because each team’s brief is personal but the format stays broadly useful.",
    visibility: "Private",
    category: "Planner",
    status: "Building",
    saves: 4,
    runs: 14,
    progress: 41,
    samplePrompt:
      "Make a daily brief app with priorities, blockers, schedule, and decision log for a small team."
  }
];

const organizations = [
  {
    name: "Northstar Events",
    domain: "northstar.events",
    seats: 18,
    apps: ["Guest Desk"]
  },
  {
    name: "Atlas Ops",
    domain: "atlasops.io",
    seats: 26,
    apps: ["Renewal Radar"]
  }
];

const tabs: Tab[] = ["Home", "Build", "Store", "Teams", "Account"];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prompt, setPrompt] = useState(sampleApps[0].samplePrompt);
  const [visibility, setVisibility] = useState<Visibility>("Private");
  const [category, setCategory] = useState<Category>("Planner");
  const [mode, setMode] = useState<"Instant" | "Advanced">("Instant");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [notice, setNotice] = useState("Foundry keeps the shell quiet: one prompt, one build lane, one clear destination.");
  const [apps, setApps] = useState<AppCard[]>(sampleApps);
  const [storeApps, setStoreApps] = useState<AppCard[]>(sampleApps.filter((app) => app.visibility === "Public"));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!apiBase) return;

      try {
        const [recentResponse, publicResponse] = await Promise.all([
          fetch(`${apiBase}/api/micro-apps?ownerId=web-demo-user`, { cache: "no-store" }),
          fetch(`${apiBase}/api/micro-apps/public`, { cache: "no-store" })
        ]);

        if (!recentResponse.ok || !publicResponse.ok) {
          return;
        }

        const recentPayload = (await recentResponse.json()) as { items: RemoteAppRecord[] };
        const publicPayload = (await publicResponse.json()) as { items: RemoteAppRecord[] };

        if (cancelled) return;

        if (recentPayload.items.length > 0) {
          setApps(recentPayload.items.map(mapRemoteApp));
        }

        if (publicPayload.items.length > 0) {
          setStoreApps(publicPayload.items.map(mapRemoteApp));
        }
      } catch {
        // The deployed web replica can still render the curated sample state when the local API is unavailable.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStore = useMemo(() => {
    if (selectedCategory === "All") {
      return storeApps;
    }

    return storeApps.filter((app) => app.category === selectedCategory);
  }, [selectedCategory, storeApps]);

  async function handleBuildSubmit(event: FormEvent) {
    event.preventDefault();

    if (!apiBase) {
      setNotice(
        `Build drafted in ${mode.toLowerCase()} mode as a ${visibility.toLowerCase()} ${category.toLowerCase()} app.`
      );
      setActiveTab("Home");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/micro-apps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ownerId: email || "web-demo-user",
          name: deriveTitle(prompt),
          prompt,
          visibility: visibility.toLowerCase() === "org" ? "organization" : visibility.toLowerCase(),
          audience: visibility === "Org" ? "team" : visibility === "Public" ? "consumer" : "personal",
          category: category.toLowerCase(),
          generationMode: mode.toLowerCase()
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setNotice(payload.error || "Build request failed.");
        return;
      }

      const created = mapRemoteApp(payload.app as RemoteAppRecord);
      setApps((current) => [created, ...current.filter((item) => item.name !== created.name)]);
      if (created.visibility === "Public") {
        setStoreApps((current) => [created, ...current.filter((item) => item.name !== created.name)]);
      }
      setNotice(`${created.name} is now in the build lane.`);
      setActiveTab("Home");
      setPrompt(created.samplePrompt);
    } catch {
      setNotice("The backend could not be reached from this web shell.");
    }
  }

  function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(
      authMode === "signin"
        ? `Sign in requested for ${email || "your account"}.`
        : `Account creation requested for ${email || "your account"}.`
    );
    setActiveTab("Home");
  }

  return (
    <main className="shell">
      <section className="phone-frame">
        <header className="phone-header">
          <div className="brand-lockup">
            <img src="/logo.png" alt="Foundry logo" className="brand-mark" />
            <div>
              <div className="eyebrow">Foundry</div>
              <h1>Micro apps, made to fit.</h1>
            </div>
          </div>
          <p>Create private tools, public utilities, and workspace apps from a single prompt.</p>
        </header>

        <section className="notice-card">{notice}</section>

        <section className="content-stack">
          {activeTab === "Home" && (
            <>
              <section className="panel">
                <div className="section-head">
                  <span>Overview</span>
                  <h2>One quiet shell for everything</h2>
                  <p>Private builds, public store launches, and team apps all use the same structure.</p>
                </div>
                <div className="metric-row">
                  <Metric label="Ready" value={String(apps.filter((app) => app.status === "Ready").length)} />
                  <Metric label="Building" value={String(apps.filter((app) => app.status !== "Ready").length)} />
                  <Metric label="Store" value={String(storeApps.length)} />
                </div>
              </section>

              <section className="section-block">
                <div className="section-head">
                  <span>Recent</span>
                  <h2>Apps in motion</h2>
                </div>
                {apps.map((app) => (
                  <article className="panel app-card" key={app.name}>
                    <div className="row top">
                      <div>
                        <h3>{app.name}</h3>
                        <p>{app.tagline}</p>
                      </div>
                      <Metric label="Status" value={app.status} compact />
                    </div>
                    <div className="chip-row">
                      <Chip>{app.visibility}</Chip>
                      <Chip>{app.category}</Chip>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${app.progress}%` }} />
                    </div>
                    <div className="row meta">
                      <small>{app.storeNote}</small>
                      <strong>{app.progress}%</strong>
                    </div>
                  </article>
                ))}
              </section>

              <section className="section-block">
                <div className="section-head">
                  <span>Store</span>
                  <h2>Public apps worth remixing</h2>
                </div>
                {storeApps.map((app) => (
                  <article className="panel" key={app.name}>
                    <div className="row top">
                      <div>
                        <h3>{app.name}</h3>
                        <p>{app.summary}</p>
                      </div>
                      <Metric label="Saves" value={String(app.saves)} compact />
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}

          {activeTab === "Build" && (
            <>
              <section className="panel">
                <div className="section-head">
                  <span>Build</span>
                  <h2>Describe one job the app should do well</h2>
                  <p>Foundry works best when the scope is narrow and immediately useful.</p>
                </div>
                <form className="form-stack" onSubmit={handleBuildSubmit}>
                  <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />

                  <div className="option-group">
                    <label>Visibility</label>
                    <div className="chip-row">
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
                  </div>

                  <div className="option-group">
                    <label>Category</label>
                    <div className="chip-row">
                      {(["Planner", "Finance", "Event", "Operations"] as Category[]).map((item) => (
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
                  </div>

                  <div className="option-group">
                    <label>Build mode</label>
                    <div className="chip-row">
                      {(["Instant", "Advanced"] as const).map((item) => (
                        <button
                          type="button"
                          key={item}
                          className={`chip-button ${mode === item ? "active" : ""}`}
                          onClick={() => setMode(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="primary-button" type="submit">
                    Start build
                  </button>
                </form>
              </section>

              <section className="panel">
                <div className="section-head">
                  <span>Starters</span>
                  <h2>Use a sample prompt</h2>
                </div>
                <div className="starter-list">
                  {sampleApps.map((app) => (
                    <button className="starter-button" key={app.name} onClick={() => setPrompt(app.samplePrompt)}>
                      <strong>{app.name}</strong>
                      <span>{app.samplePrompt}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "Store" && (
            <>
              <section className="panel">
                <div className="section-head">
                  <span>Public Store</span>
                  <h2>A store for useful, legible apps</h2>
                  <p>Public apps are small, clear, and easy to remix into a private or team copy.</p>
                </div>
                <div className="chip-row">
                  {(["All", "Planner", "Finance", "Event", "Operations"] as const).map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`chip-button ${selectedCategory === item ? "active" : ""}`}
                      onClick={() => setSelectedCategory(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              {filteredStore.map((app) => (
                <article className="panel" key={app.name}>
                  <div className="row top">
                    <div>
                      <h3>{app.name}</h3>
                      <p>{app.tagline}</p>
                    </div>
                    <button className="secondary-button" onClick={() => setPrompt(`Remix ${app.name}: ${app.summary}`)}>
                      Remix
                    </button>
                  </div>
                  <div className="chip-row">
                    <Chip>{app.category}</Chip>
                    <Chip>{`${app.saves} saves`}</Chip>
                  </div>
                  <p className="body-copy">{app.summary}</p>
                  <small>{app.storeNote}</small>
                </article>
              ))}
            </>
          )}

          {activeTab === "Teams" && (
            <>
              <section className="panel">
                <div className="section-head">
                  <span>Workspaces</span>
                  <h2>Shared tools with a single owner trail</h2>
                  <p>Team apps keep one live URL, shared access, and prompt-based version notes.</p>
                </div>
              </section>

              {organizations.map((org) => (
                <article className="panel" key={org.name}>
                  <div className="row top">
                    <div>
                      <h3>{org.name}</h3>
                      <p>{org.domain}</p>
                    </div>
                    <Metric label="Seats" value={String(org.seats)} compact />
                  </div>
                  <div className="starter-list">
                    {org.apps.map((appName) => (
                      <div className="workspace-row" key={appName}>
                        <strong>{appName}</strong>
                        <Chip>Shared</Chip>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </>
          )}

          {activeTab === "Account" && (
            <>
              <section className="panel">
                <div className="section-head">
                  <span>Account</span>
                  <h2>Sign in to your workspace</h2>
                  <p>Email and password are handled by Supabase Auth for this PoC.</p>
                </div>

                <form className="form-stack" onSubmit={handleAuthSubmit}>
                  <div className="chip-row">
                    <button
                      type="button"
                      className={`chip-button ${authMode === "signin" ? "active" : ""}`}
                      onClick={() => setAuthMode("signin")}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      className={`chip-button ${authMode === "signup" ? "active" : ""}`}
                      onClick={() => setAuthMode("signup")}
                    >
                      Create Account
                    </button>
                  </div>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    type="email"
                  />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    type="password"
                  />
                  <button className="primary-button" type="submit">
                    {authMode === "signin" ? "Continue" : "Create Account"}
                  </button>
                </form>
              </section>

              <section className="panel">
                <div className="section-head">
                  <span>Platform</span>
                  <h2>Connection status</h2>
                </div>
                <div className="status-list">
                  <StatusRow label="Supabase" value="Ready" />
                  <StatusRow label="Backend API" value={apiBase ? "Ready" : "Sample mode"} />
                  <StatusRow label="Email login" value="Ready" />
                </div>
              </section>
            </>
          )}
        </section>

        <nav className="bottom-nav" aria-label="Primary">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`nav-item ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`metric ${compact ? "compact" : ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function mapRemoteApp(record: RemoteAppRecord): AppCard {
  const template = sampleApps.find((app) => app.name.toLowerCase() === record.name.toLowerCase());
  const visibility = mapVisibility(record.visibility);
  const category = mapCategory(record.category);
  const status = mapStatus(record.status);
  const progress = status === "Ready" ? 100 : status === "In Review" ? 84 : 34;

  if (template) {
    return {
      ...template,
      visibility,
      category,
      status,
      progress
    };
  }

  return {
    name: record.name,
    tagline:
      visibility === "Public"
        ? `A public ${category.toLowerCase()} utility ready for the store.`
        : visibility === "Org"
          ? `A shared ${category.toLowerCase()} app built for one workspace.`
          : `A private ${category.toLowerCase()} tool shaped around one clear need.`,
    summary: record.summary,
    storeNote:
      visibility === "Public"
        ? "Public apps enter the store only after a review pass and quality check."
        : visibility === "Org"
          ? "Workspace apps inherit team visibility, version history, and ownership rules."
          : "Private builds stay in your account until you choose to publish or share.",
    visibility,
    category,
    status,
    saves: 0,
    runs: 0,
    progress,
    samplePrompt: record.summary
  };
}

function mapVisibility(value: RemoteAppRecord["visibility"]): Visibility {
  switch (value) {
    case "public":
      return "Public";
    case "organization":
      return "Org";
    default:
      return "Private";
  }
}

function mapCategory(value: string): Category {
  switch (value.toLowerCase()) {
    case "finance":
      return "Finance";
    case "event":
      return "Event";
    case "operations":
      return "Operations";
    default:
      return "Planner";
  }
}

function mapStatus(value: string) {
  switch (value.toLowerCase()) {
    case "ready":
      return "Ready";
    case "reviewing":
      return "In Review";
    case "failed":
      return "Needs Fix";
    default:
      return "Building";
  }
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
