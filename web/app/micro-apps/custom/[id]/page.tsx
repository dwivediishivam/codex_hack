"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { GeneratedAppRecord, GeneratedAppSpec, GeneratedEntry } from "../../../../lib/generated-apps";
import { buildApiUrl } from "../../../../lib/api";

type ViewId = "overview" | "capture" | "entries";

export default function CustomAppPage() {
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<GeneratedAppRecord | null>(null);
  const [spec, setSpec] = useState<GeneratedAppSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewId>("overview");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<GeneratedEntry[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!params.id) return;

    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(`/api/micro-apps/${params.id}`), { cache: "no-store" });
        const payload = (await response.json()) as {
          error?: string;
          app?: GeneratedAppRecord;
          spec?: GeneratedAppSpec;
        };

        if (!response.ok || !payload.app || !payload.spec) {
          throw new Error(payload.error || "App not found");
        }

        if (cancelled) return;

        setApp(payload.app);
        setSpec(payload.spec);
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "App not found");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!params.id || typeof window === "undefined") return;

    try {
      const savedEntries = window.localStorage.getItem(storageKey(params.id, "entries"));
      const savedNotes = window.localStorage.getItem(storageKey(params.id, "notes"));
      const parsedEntries = savedEntries ? (JSON.parse(savedEntries) as GeneratedEntry[]) : [];

      setEntries(parsedEntries);
      setNotes(savedNotes ?? "");
    } catch {
      setEntries([]);
      setNotes("");
    }
  }, [params.id]);

  useEffect(() => {
    if (!params.id || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(params.id, "entries"), JSON.stringify(entries));
  }, [entries, params.id]);

  useEffect(() => {
    if (!params.id || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(params.id, "notes"), notes);
  }, [notes, params.id]);

  const completionCount = useMemo(() => {
    return entries.filter((entry) => Object.values(entry.values).some((value) => value.trim().length > 0)).length;
  }, [entries]);

  if (loading) {
    return (
      <main className="micro-shell">
        <Link href="/" className="micro-back">
          Back
        </Link>
        <section className="micro-card">
          <div className="loader-card">
            <div className="loader-bar">
              <span className="loader-fill step-building" />
            </div>
            <strong>Loading app</strong>
          </div>
        </section>
      </main>
    );
  }

  if (!app || !spec) {
    return (
      <main className="micro-shell">
        <Link href="/" className="micro-back">
          Back
        </Link>
        <section className="micro-card">
          <h1>App not found</h1>
          <p>{error || "This app could not be loaded."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="micro-shell">
      <Link href="/" className="micro-back">
        Back
      </Link>

      <section className="micro-card generated-app-card" style={{ ["--app-accent" as string]: spec.accent }}>
        <div className="generated-hero">
          <h1>{app.name}</h1>
          <p>{spec.summary}</p>
        </div>

        <div className="focus-strip">
          {spec.focus.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>

        <div className="segmented micro-tabs">
          {spec.views.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => setView(item.id as ViewId)}
              type="button"
            >
              {item.title}
            </button>
          ))}
        </div>

        {view === "overview" ? (
          <div className="micro-stack">
            <article className="feature-card">
              <strong>What it does</strong>
              <span>{spec.description}</span>
            </article>
            <div className="metric-grid">
              <article className="metric-card">
                <span>Saved items</span>
                <strong>{entries.length}</strong>
              </article>
              <article className="metric-card">
                <span>With content</span>
                <strong>{completionCount}</strong>
              </article>
            </div>
            <article className="feature-card">
              <strong>Next step</strong>
              <span>{spec.views.find((item) => item.id === "capture")?.description}</span>
            </article>
          </div>
        ) : null}

        {view === "capture" ? (
          <div className="micro-stack">
            {spec.fields.map((field) =>
              field.type === "notes" ? (
                <textarea
                  key={field.id}
                  value={draft[field.id] ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.id]: event.target.value }))}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  key={field.id}
                  value={draft[field.id] ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.id]: event.target.value }))}
                  placeholder={field.placeholder}
                  type={field.type}
                />
              )
            )}

            <button
              className="micro-button"
              onClick={() => {
                if (!spec.fields.some((field) => (draft[field.id] ?? "").trim())) return;

                setEntries((current) => [
                  {
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    values: spec.fields.reduce<Record<string, string>>((result, field) => {
                      result[field.id] = draft[field.id] ?? "";
                      return result;
                    }, {})
                  },
                  ...current
                ]);
                setDraft({});
                setView("entries");
              }}
            >
              {spec.primaryActionLabel}
            </button>
          </div>
        ) : null}

        {view === "entries" ? (
          <div className="micro-stack">
            {entries.length === 0 ? (
              <section className="feature-card">
                <strong>{spec.emptyStateTitle}</strong>
                <span>{spec.emptyStateBody}</span>
              </section>
            ) : (
              <div className="micro-list">
                {entries.map((entry) => (
                  <article className="micro-list-row static generated-entry" key={entry.id}>
                    <div>
                      <strong>{entry.values[spec.fields[0]?.id] || "Untitled"}</strong>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="entry-grid">
                      {spec.fields.map((field) =>
                        entry.values[field.id] ? (
                          <div key={field.id} className="entry-field">
                            <small>{field.label}</small>
                            <span>{entry.values[field.id]}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
          </div>
        ) : null}
      </section>
    </main>
  );
}

function storageKey(id: string, suffix: string) {
  return `foundry.generated.${id}.${suffix}`;
}
