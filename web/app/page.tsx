"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";

type Visibility = "Private" | "Public" | "Org";
type Category = "Planner" | "Finance" | "Event" | "Operations";
type Tab = "Home" | "Build" | "Store" | "Teams" | "Account";

const sampleApps = [
  {
    name: "Spend Hours",
    tagline: "See what a purchase costs in working hours.",
    summary:
      "Turn any item into hours of work, compare impulse buys against planned spending, and keep a calmer view of what something really costs.",
    storeNote: "A strong public utility because the concept is universal and easy to understand in seconds.",
    visibility: "Public" as Visibility,
    category: "Finance" as Category,
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
    visibility: "Public" as Visibility,
    category: "Event" as Category,
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
    visibility: "Org" as Visibility,
    category: "Operations" as Category,
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
    visibility: "Private" as Visibility,
    category: "Planner" as Category,
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

  const publicApps = useMemo(
    () => sampleApps.filter((app) => app.visibility === "Public"),
    []
  );

  const filteredStore = useMemo(() => {
    if (selectedCategory === "All") {
      return publicApps;
    }

    return publicApps.filter((app) => app.category === selectedCategory);
  }, [publicApps, selectedCategory]);

  function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(
      authMode === "signin"
        ? `Sign in requested for ${email || "your account"}.`
        : `Account creation requested for ${email || "your account"}.`
    );
    setActiveTab("Home");
  }

  function handleBuildSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(
      `Build queued in ${mode.toLowerCase()} mode as a ${visibility.toLowerCase()} ${category.toLowerCase()} app.`
    );
    setActiveTab("Home");
  }

  return (
    <main className="shell">
      <section className="phone-frame">
        <header className="phone-header">
          <div>
            <div className="eyebrow">Foundry</div>
            <h1>Micro apps, made to fit.</h1>
          </div>
          <p>
            Create private tools, public utilities, and workspace apps from a single prompt.
          </p>
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
                  <Metric label="Ready" value="2" />
                  <Metric label="Building" value="2" />
                  <Metric label="Store" value="2" />
                </div>
              </section>

              <section className="section-block">
                <div className="section-head">
                  <span>Recent</span>
                  <h2>Apps in motion</h2>
                </div>
                {sampleApps.map((app) => (
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
                {publicApps.map((app) => (
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
                  <StatusRow label="Backend API" value="Ready" />
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
