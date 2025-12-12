"use client";

import { useEffect, useRef, useState } from "react";

const BASELINE_KEY = "nutrimind_baseline_v2";
const SUMMARY_KEY = "nutrimind-today-summary";

export default function CoachPage() {
  const [baseline, setBaseline] = useState(null);
  const [summary, setSummary] = useState(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "coach",
      text: "Yo, I’m locked in. Ask about food, training, or recovery and I’ll use your baseline + today’s log automatically.",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ---- load baseline + summary from localStorage ----
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawBaseline =
        window.localStorage.getItem(BASELINE_KEY) ||
        window.localStorage.getItem("nutrimindBaseline") ||
        window.localStorage.getItem("nutrimind-baseline");

      if (rawBaseline) {
        setBaseline(JSON.parse(rawBaseline));
      }
    } catch {
      // ignore
    }

    try {
      const rawSummary = window.localStorage.getItem(SUMMARY_KEY);
      if (rawSummary) {
        setSummary(JSON.parse(rawSummary));
      }
    } catch {
      // ignore
    }
  }, []);

  // ---- auto scroll to bottom when messages change ----
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const athleteName = baseline?.name || "Athlete";
  const role = baseline?.role || "No role set yet";
  const sport = baseline?.mainSport || "No sport set yet";
  const mainGoal =
    baseline?.mainGoal ||
    "Set a clear goal on your Baseline page so coaching can focus up.";

  const bodyweight =
    baseline?.bodyweightLb ??
    baseline?.bodyweight ??
    baseline?.weightLb ??
    null;

  const trainingDays = baseline?.trainingDays ?? null;

  const caloriesToday = summary?.calories ?? 0;
  const targetCalories = summary?.targetCalories ?? 0;
  const proteinToday = summary?.protein_g ?? 0;
  const targetProtein = summary?.targetProtein_g ?? 0;
  const hydrationToday = summary?.hydrationOz ?? 0;
  const hydrationTarget = summary?.hydrationTargetOz ?? 0;

  const formatNumber = (n) =>
    typeof n === "number" ? n.toLocaleString() : n;

  // ---- typewriter effect for coach reply ----
  const typeCoachReply = (fullText) => {
    const id = Date.now() + Math.random();
    let index = 0;

    // add empty assistant message first
    setMessages((prev) => [
      ...prev,
      { id, from: "coach", text: "" },
    ]);

    const interval = setInterval(() => {
      index += 2; // speed: 2 characters per tick
      const slice = fullText.slice(0, index);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, text: slice } : m
        )
      );

      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 12); // lower = faster typing
  };

  // ---- send message to backend /api ----
  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      id: Date.now(),
      from: "user",
      text: trimmed,
    };

    // add user message immediately
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/coach/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed + "\n\nKeep the answer concise, with tight bullets or short paragraphs.",
          baseline: baseline || null,
          history: null, // optional – you can wire your 7-day history here later
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        const errorText =
          data?.message ||
          "Coach had a problem answering that. Try again in a second.";
        typeCoachReply(errorText);
      } else {
        const replyText =
          data.message ||
          "I got your question, but couldn't format the answer.";
        typeCoachReply(replyText);
      }
    } catch (err) {
      console.error("Coach fetch error:", err);
      typeCoachReply(
        "My brain lagged for a second (server error). Try the question one more time."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 16px 40px",
        display: "flex",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, #fef3c7 0, #fdf2f8 20%, #f3f4f6 55%, #e5e7eb 100%)",
        color: "#0f172a",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1120 }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              NUTRIMIND AI · COACH
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                margin: 0,
                color: "#0f172a",
              }}
            >
              Talk to your AI coach like it’s in the locker room.
            </h1>
            <p
              style={{
                marginTop: 6,
                fontSize: 14,
                color: "#6b7280",
                maxWidth: 520,
              }}
            >
              Ask about food, training, recovery, or game-day. The coach quietly
              pulls from your baseline and today’s log so answers stay personal.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "999px",
                padding: 2,
                background:
                  "conic-gradient(from 140deg, #f97316, #fb7185, #ec4899, #f97316)",
                boxShadow: "0 14px 40px rgba(248,113,113,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "999px",
                  background: "#020617",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f9fafb",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {athleteName[0]?.toUpperCase?.() || "A"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {athleteName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                {role} · {sport}
              </div>
            </div>
          </div>
        </header>

        {/* GRID LAYOUT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.85fr) minmax(260px, 1.15fr)",
            gap: 22,
          }}
        >
          {/* LEFT: CHAT + SUGGESTIONS */}
          <section
            style={{
              position: "relative",
              borderRadius: 26,
              padding: 16,
              background:
                "radial-gradient(circle at top left,#020617,#020617 50%,#111827 100%)",
              boxShadow:
                "0 24px 70px rgba(15,23,42,0.75), 0 0 0 1px rgba(15,23,42,0.7)",
              overflow: "hidden",
              minHeight: 460,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at top left, rgba(248,113,113,0.3) 0, transparent 45%), radial-gradient(circle at bottom right, rgba(59,130,246,0.3) 0, transparent 50%)",
                pointerEvents: "none",
              }}
            />

            {/* top row */}
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#9ca3af",
                    marginBottom: 3,
                  }}
                >
                  Live coaching feed
                </div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#f9fafb",
                    margin: 0,
                  }}
                >
                  Ask like you text your real coach.
                </h2>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#e5e7eb",
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(56,189,248,0.7)",
                  background:
                    "linear-gradient(135deg,rgba(15,23,42,0.8),rgba(15,23,42,0.95))",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  backdropFilter: "blur(14px)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "999px",
                    background:
                      "radial-gradient(circle at 30% 30%, #bbf7d0, #22c55e)",
                    boxShadow: "0 0 12px rgba(74,222,128,0.8)",
                  }}
                />
                Baseline-aware
              </div>
            </div>

            {/* chat box */}
            <div
              style={{
                position: "relative",
                flex: 1,
                borderRadius: 18,
                border: "1px solid rgba(31,41,55,0.9)",
                background:
                  "radial-gradient(circle at top, rgba(15,23,42,0.96), rgba(15,23,42,0.98))",
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflow: "hidden",
              }}
            >
              {/* messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingRight: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf:
                        m.from === "user" ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      padding: "8px 11px",
                      borderRadius:
                        m.from === "user"
                          ? "14px 14px 2px 14px"
                          : "14px 14px 14px 2px",
                      background:
                        m.from === "user"
                          ? "linear-gradient(135deg,#f97316,#fb7185,#ec4899)"
                          : "rgba(31,41,55,0.95)",
                      border:
                        m.from === "user"
                          ? "1px solid rgba(248,113,113,0.7)"
                          : "1px solid rgba(55,65,81,0.9)",
                      fontSize: 13,
                      color: "#f9fafb",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* input */}
              <form
                onSubmit={handleSend}
                style={{
                  borderTop: "1px solid rgba(31,41,55,0.9)",
                  paddingTop: 8,
                  marginTop: 4,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about tonight’s food, a lift, or your next race plan…"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    borderRadius: 999,
                    border: "1px solid rgba(55,65,81,0.9)",
                    padding: "8px 12px",
                    fontSize: 13,
                    background: "rgba(15,23,42,0.95)",
                    color: "#f9fafb",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: isLoading
                      ? "rgba(148,163,184,0.8)"
                      : "linear-gradient(135deg,#f97316,#fb7185,#ec4899)",
                    color: "#f9fafb",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 14px 32px rgba(248,113,113,0.65)",
                  }}
                >
                  {isLoading ? "Thinking…" : "Send"}
                </button>
              </form>

              {/* quick suggestions */}
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                {[
                  "Dial in my macros this week",
                  "Build a pre-meet day with cheap food",
                  "Fix recovery after heavy legs",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setInput(chip)}
                    style={{
                      borderRadius: 999,
                      border: "1px solid rgba(55,65,81,0.9)",
                      background: "rgba(15,23,42,0.9)",
                      padding: "4px 9px",
                      color: "#e5e7eb",
                      cursor: "pointer",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  marginTop: 2,
                }}
              >
                No need to repeat your weight or training days — the coach
                already sees that from your baseline.
              </p>
            </div>
          </section>

          {/* RIGHT: SNAPSHOT + BASELINE + FUTURE PHOTO CARD */}
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Today snapshot */}
            <section
              style={{
                background: "#f9fafb",
                borderRadius: 22,
                padding: "14px 16px",
                boxShadow:
                  "0 18px 40px rgba(148,163,184,0.35), 0 0 0 1px rgba(209,213,219,0.9)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Today’s snapshot
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 10,
                }}
              >
                What your coach is “seeing” from your daily log right now.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <SnapshotRow
                  label="Calories"
                  value={
                    targetCalories
                      ? `${formatNumber(caloriesToday)} / ${formatNumber(
                          targetCalories
                        )} kcal`
                      : `${formatNumber(caloriesToday)} kcal`
                  }
                  highlight
                />
                <SnapshotRow
                  label="Protein"
                  value={
                    targetProtein
                      ? `${formatNumber(proteinToday)} / ${formatNumber(
                          targetProtein
                        )} g`
                      : `${formatNumber(proteinToday)} g`
                  }
                />
                <SnapshotRow
                  label="Hydration"
                  value={
                    hydrationTarget
                      ? `${formatNumber(hydrationToday)} / ${formatNumber(
                          hydrationTarget
                        )} oz`
                      : `${formatNumber(hydrationToday)} oz`
                  }
                />
                <SnapshotRow
                  label="Training"
                  value={
                    trainingDays
                      ? `${trainingDays} days / week`
                      : "Not set yet"
                  }
                />
              </div>
            </section>

            {/* Baseline summary */}
            <section
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "14px 16px",
                boxShadow:
                  "0 16px 36px rgba(148,163,184,0.32), 0 0 0 1px rgba(209,213,219,0.9)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Baseline anchor
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                The version of you I’m coaching.
              </div>

              <div
                style={{
                  borderRadius: 14,
                  padding: "8px 9px",
                  background: "#f9fafb",
                  fontSize: 12,
                  color: "#4b5563",
                  marginBottom: 8,
                }}
              >
                <strong>Goal:</strong> {mainGoal}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <BaselinePill
                  label="Bodyweight"
                  value={
                    bodyweight
                      ? `${bodyweight} lb`
                      : "Add bodyweight on Baseline page"
                  }
                />
                <BaselinePill label="Sport / role" value={sport} />
              </div>

              <p
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 6,
                }}
              >
                If your weight, schedule, or sport changes, update your baseline
                and the coach will adapt automatically.
              </p>
            </section>

            {/* FUTURE: PHOTO CARD */}
            <section
              style={{
                background:
                  "linear-gradient(135deg,#f97316,#fb7185,#ec4899)",
                borderRadius: 20,
                padding: "14px 15px",
                color: "#f9fafb",
                boxShadow: "0 18px 55px rgba(248,113,113,0.7)",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "rgba(15,23,42,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                }}
              >
                📸
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  Coming soon: photo check-ins
                </div>
                <p
                  style={{
                    fontSize: 12,
                    margin: 0,
                  }}
                >
                  You’ll be able to drop progress pics or plate photos so the
                  coach can give even smarter feedback.
                </p>
              </div>
              <button
                type="button"
                disabled
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "rgba(15,23,42,0.3)",
                  color: "#e5e7eb",
                  cursor: "not-allowed",
                }}
              >
                Soon
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SnapshotRow({ label, value, highlight }) {
  return (
    <div
      style={{
        borderRadius: 13,
        padding: "7px 8px",
        background: highlight ? "#fef3c7" : "#f3f4f6",
        border: highlight ? "1px solid #fbbf24" : "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: highlight ? "#92400e" : "#6b7280",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function BaselinePill({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 999,
        padding: "7px 10px",
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#9ca3af",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#111827",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}
