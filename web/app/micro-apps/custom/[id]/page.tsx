"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type CustomAppSpec = {
  id: string;
  name: string;
  summary: string;
  prompt: string;
  focus: string[];
};

export default function CustomAppPage() {
  const params = useParams<{ id: string }>();
  const [spec, setSpec] = useState<CustomAppSpec | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem("foundry.customApps");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as CustomAppSpec[];
      const resolved = parsed.find((item) => item.id === params.id) ?? null;
      setSpec(resolved);
    } catch {
      setSpec(null);
    }
  }, [params.id]);

  if (!spec) {
    return (
      <main className="micro-shell">
        <Link href="/" className="micro-back">
          Back
        </Link>
        <section className="micro-card">
          <h1>App not found</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="micro-shell">
      <Link href="/" className="micro-back">
        Back
      </Link>
      <section className="micro-card">
        <h1>{spec.name}</h1>
        <p>{spec.summary}</p>

        <div className="micro-list">
          {spec.focus.map((item) => (
            <article className="micro-list-row static" key={item}>
              <div>
                <strong>{item}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="micro-inline">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add item" />
          <button
            className="micro-button compact"
            onClick={() => {
              if (!draft.trim()) return;
              setItems((current) => [...current, draft.trim()]);
              setDraft("");
            }}
          >
            Add
          </button>
        </div>

        <div className="micro-list">
          {items.map((item, index) => (
            <article className="micro-list-row static" key={`${item}-${index}`}>
              <div>
                <strong>{item}</strong>
              </div>
            </article>
          ))}
        </div>

        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
      </section>
    </main>
  );
}
