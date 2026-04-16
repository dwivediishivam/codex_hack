"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, ReactNode, useMemo, useState } from "react";

const guestSeed = [
  { id: 1, name: "Aarav Mehta", checkedIn: false, note: "VIP" },
  { id: 2, name: "Riya Shah", checkedIn: true, note: "Speaker" },
  { id: 3, name: "Kabir Jain", checkedIn: false, note: "" }
];

const renewalSeed = [
  { id: 1, name: "Notion", owner: "Ops", due: "2026-04-28", decision: "Keep" },
  { id: 2, name: "Figma", owner: "Design", due: "2026-05-12", decision: "Review" },
  { id: 3, name: "Zapier", owner: "Growth", due: "2026-05-22", decision: "Cancel" }
];

const polaroidFormats = [
  { id: "mini", label: "Mini", frame: "54 x 86 mm", countA4: 8, countA3: 16 },
  { id: "classic", label: "Classic", frame: "88 x 107 mm", countA4: 4, countA3: 8 },
  { id: "wide", label: "Wide", frame: "108 x 86 mm", countA4: 4, countA3: 8 }
] as const;

export default function MicroAppPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  return <MicroAppPageClient slug={slug} />;
}

function MicroAppPageClient({ slug }: { slug: string }) {
  if (slug === "spend-hours") return <SpendHoursApp />;
  if (slug === "guest-desk") return <GuestDeskApp />;
  if (slug === "renewal-radar") return <RenewalRadarApp />;
  if (slug === "brief-deck") return <BriefDeckApp />;
  if (slug === "polaroid-print") return <PolaroidPrintApp />;
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

function SpendHoursApp() {
  const [price, setPrice] = useState("3499");
  const [hourlyRate, setHourlyRate] = useState("500");
  const [hoursPerDay, setHoursPerDay] = useState("8");

  const hours = Math.max(0, toNumber(price) / Math.max(toNumber(hourlyRate), 1));
  const days = hours / Math.max(toNumber(hoursPerDay), 1);

  return (
    <MicroShell title="Spend Hours">
      <div className="micro-grid">
        <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" />
        <input value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} placeholder="Hourly pay" />
        <input value={hoursPerDay} onChange={(event) => setHoursPerDay(event.target.value)} placeholder="Hours per day" />
      </div>
      <section className="micro-result">
        <strong>{hours.toFixed(1)} hours</strong>
        <span>{days.toFixed(1)} days</span>
      </section>
    </MicroShell>
  );
}

function GuestDeskApp() {
  const [guests, setGuests] = useState(guestSeed);
  const [name, setName] = useState("");

  return (
    <MicroShell title="Guest Desk">
      <div className="micro-inline">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Guest name" />
        <button
          className="micro-button"
          onClick={() => {
            if (!name.trim()) return;
            setGuests((current) => [...current, { id: Date.now(), name, checkedIn: false, note: "" }]);
            setName("");
          }}
        >
          Add
        </button>
      </div>

      <div className="micro-list">
        {guests.map((guest) => (
          <button
            className="micro-list-row"
            key={guest.id}
            onClick={() =>
              setGuests((current) =>
                current.map((item) => (item.id === guest.id ? { ...item, checkedIn: !item.checkedIn } : item))
              )
            }
          >
            <div>
              <strong>{guest.name}</strong>
              <span>{guest.note || "Guest"}</span>
            </div>
            <span>{guest.checkedIn ? "In" : "Waiting"}</span>
          </button>
        ))}
      </div>
    </MicroShell>
  );
}

function RenewalRadarApp() {
  const [items, setItems] = useState(renewalSeed);

  return (
    <MicroShell title="Renewal Radar">
      <div className="micro-list">
        {items.map((item) => (
          <article className="micro-list-row static" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>
                {item.owner} • {item.due}
              </span>
            </div>
            <select
              value={item.decision}
              onChange={(event) =>
                setItems((current) =>
                  current.map((entry) =>
                    entry.id === item.id ? { ...entry, decision: event.target.value } : entry
                  )
                )
              }
            >
              <option>Keep</option>
              <option>Review</option>
              <option>Cancel</option>
            </select>
          </article>
        ))}
      </div>
    </MicroShell>
  );
}

function BriefDeckApp() {
  const [priorities, setPriorities] = useState("Ship mobile shell\nTest micro apps");
  const [blockers, setBlockers] = useState("Need Supabase tables");
  const [schedule, setSchedule] = useState("11:00 QA\n15:00 deploy");
  const [notes, setNotes] = useState("Keep the UI quiet.");

  return (
    <MicroShell title="Brief Deck">
      <div className="micro-stack">
        <textarea value={priorities} onChange={(event) => setPriorities(event.target.value)} placeholder="Priorities" />
        <textarea value={blockers} onChange={(event) => setBlockers(event.target.value)} placeholder="Blockers" />
        <textarea value={schedule} onChange={(event) => setSchedule(event.target.value)} placeholder="Schedule" />
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
      </div>
    </MicroShell>
  );
}

function PolaroidPrintApp() {
  const [image, setImage] = useState<string | null>(null);
  const [formatId, setFormatId] = useState<(typeof polaroidFormats)[number]["id"]>("classic");
  const [sheet, setSheet] = useState<"A4" | "A3">("A4");

  const format = polaroidFormats.find((item) => item.id === formatId) ?? polaroidFormats[1];
  const printCount = sheet === "A4" ? format.countA4 : format.countA3;

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
  }

  const tiles = useMemo(() => Array.from({ length: printCount }), [printCount]);

  return (
    <MicroShell title="Polaroid Print">
      <div className="micro-stack">
        <input type="file" accept="image/*" capture="environment" onChange={onPick} />

        <div className="chip-row">
          {polaroidFormats.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`chip-button ${formatId === item.id ? "active" : ""}`}
              onClick={() => setFormatId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="chip-row">
          {(["A4", "A3"] as const).map((item) => (
            <button
              type="button"
              key={item}
              className={`chip-button ${sheet === item ? "active" : ""}`}
              onClick={() => setSheet(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <section className="micro-result left">
          <strong>{format.frame}</strong>
          <span>
            {sheet} sheet • {printCount} prints
          </span>
        </section>

        <div className="polaroid-preview">
          <div className="polaroid-frame">
            {image ? <img src={image} alt="Preview" /> : <span>Add a photo</span>}
          </div>
        </div>

        <div className={`print-sheet ${sheet.toLowerCase()}`}>
          {tiles.map((_, index) => (
            <div className="print-tile" key={index}>
              <div className="polaroid-frame small">{image ? <img src={image} alt="" /> : null}</div>
            </div>
          ))}
        </div>

        <button className="micro-button" onClick={() => window.print()}>
          Print
        </button>
      </div>
    </MicroShell>
  );
}

function MicroShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="micro-shell">
      <Link href="/" className="micro-back">
        Back
      </Link>
      <section className="micro-card">
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

function toNumber(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
