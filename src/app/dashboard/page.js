"use client";

import { useEffect, useState } from "react";

// ---------- helpers ----------
const todayKey = () => new Date().toISOString().slice(0, 10);
const formatDateLong = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

// ---------- small components ----------

// circular ring card (ring always visually caps at 100%)
function RingCard({ label, value, subLabel, percent, accent }) {
  const size = 130;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // ring fill (0–100 visually)
  const visualPct = Math.max(0, Math.min(percent || 0, 100));
  const offset = circumference - (visualPct / 100) * circumference;

  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 20,
        padding: "14px 16px",
        boxShadow:
          "0 18px 40px rgba(15,23,42,0.04), 0 0 0 1px rgba(209,213,219,0.7)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={accent || "#22c55e"}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset .35s ease-out",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#4b5563",
          }}
        >
          {/* show the REAL percent (can be 300% etc) */}
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {Math.round(percent || 0)}%
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>of target</div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: ".18em",
            color: "#9ca3af",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
        {subLabel && (
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            {subLabel}
          </div>
        )}
      </div>
    </div>
  );
}

// NEW weekly “fuel consistency” card (more useful than old squiggle line)
function WeeklyTrend({ history, calorieTarget }) {
  if (!history || history.length === 0 || !calorieTarget) {
    return (
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 20,
          padding: "16px 18px",
          boxShadow:
            "0 18px 40px rgba(15,23,42,0.04), 0 0 0 1px rgba(209,213,219,0.7)",
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        Once you log in <strong>Daily Log</strong>, this will show how
        consistent your last 7 days of fuel were vs. your target.
      </div>
    );
  }

  const sorted = [...history]
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-7); // only last 7 days

  const dayPcts = sorted.map((d) =>
    calorieTarget ? (d.kcal || 0) / calorieTarget * 100 : 0
  );
  const avgPct =
    dayPcts.reduce((sum, p) => sum + (p || 0), 0) / dayPcts.length || 0;

  let grade = "Off";
  let gradeText = "Fuel is way off target. Let’s tighten it up.";
  let gradeColor = "#b91c1c";

  if (avgPct >= 90 && avgPct <= 110) {
    grade = "Green";
    gradeText = "You’re fueling really consistently. Nice work.";
    gradeColor = "#16a34a";
  } else if (avgPct >= 75 && avgPct < 90) {
    grade = "Almost";
    gradeText = "Close to target. One or two days were low.";
    gradeColor = "#f59e0b";
  } else if (avgPct > 110 && avgPct <= 130) {
    grade = "High";
    gradeText = "Slightly over target. Fine on heavy training weeks.";
    gradeColor = "#fb923c";
  }

  const labelForPct = (p) => {
    if (!p) return "⚪";
    if (p < 70) return "⬇️";
    if (p <= 110) return "✅";
    return "⬆️";
  };

  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow:
          "0 18px 40px rgba(15,23,42,0.04), 0 0 0 1px rgba(209,213,219,0.7)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            Weekly fuel consistency
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Average vs your calorie target over the last 7 days.
          </div>
        </div>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            background: "#ffffff",
            border: `1px solid ${gradeColor}`,
            color: gradeColor,
          }}
        >
          {Math.round(avgPct || 0)}% · {grade}
        </div>
      </div>

      {/* 7-day bar – very visual */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 6,
          marginBottom: 4,
        }}
      >
        {sorted.map((d, idx) => {
          const pct = dayPcts[idx] || 0;
          let color = "#e5e7eb";
          if (pct < 70) color = "#fecaca"; // low – red
          else if (pct <= 110) color = "#bbf7d0"; // good – green
          else color = "#fee2e2"; // high – light red

          const height = Math.min(Math.max(pct, 20), 140);

          return (
            <div
              key={d.date}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontSize: 10,
                color: "#6b7280",
              }}
            >
              <div
                style={{
                  height,
                  width: 10,
                  borderRadius: 999,
                  background: color,
                  border: "1px solid #d1d5db",
                }}
              />
              <div style={{ marginTop: 4 }}>
                {labelForPct(pct)} {Math.round(pct || 0)}%
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
        {gradeText}
      </div>
    </div>
  );
}

// weight graph + logger – now gives actual insight
function WeightCard({
  weightHistory,
  onAddWeight,
  weightInput,
  setWeightInput,
}) {
  const hasData = weightHistory && weightHistory.length > 0;

  let points = "";
  let sorted = [];
  let minW = 0;
  let maxW = 0;
  let startWeight = null;
  let latestWeight = null;
  let change = 0;
  let changePerEntry = 0;

  if (hasData) {
    sorted = [...weightHistory].sort((a, b) =>
      a.date > b.date ? 1 : a.date < b.date ? -1 : 0
    );
    const weights = sorted.map((d) => d.weight);
    minW = Math.min(...weights);
    maxW = Math.max(...weights);
    const span = maxW - minW || 1;

    startWeight = sorted[0].weight;
    latestWeight = sorted[sorted.length - 1].weight;
    change = latestWeight - startWeight;
    changePerEntry =
      sorted.length > 1 ? change / (sorted.length - 1) : 0;

    points = sorted
      .map((d, idx) => {
        const x =
          sorted.length === 1 ? 10 : (idx / (sorted.length - 1)) * 90 + 5;
        const normalized = 1 - (d.weight - minW) / span;
        const y = normalized * 60 + 20;
        return `${x},${y}`;
      })
      .join(" ");
  }

  const trendColor =
    change < 0 ? "#16a34a" : change > 0 ? "#b91c1c" : "#6b7280";
  const trendLabel =
    change < 0 ? "down" : change > 0 ? "up" : "flat";

  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow:
          "0 18px 40px rgba(15,23,42,0.04), 0 0 0 1px rgba(209,213,219,0.7)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Weight trend</div>
        {hasData && (
          <div style={{ fontSize: 11, color: trendColor }}>
            {trendLabel} {change > 0 ? "+" : ""}
            {change.toFixed(1)} over {sorted.length} logs
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280" }}>
        Log your weight a few times per week to see direction, not single-day
        noise.
      </div>

      <div style={{ width: "100%", height: 130, marginTop: 4 }}>
        {hasData ? (
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.7"
              points={points}
            />
            {sorted.map((d, idx) => {
              const span = maxW - minW || 1;
              const x =
                sorted.length === 1 ? 10 : (idx / (sorted.length - 1)) * 90 + 5;
              const normalized = 1 - (d.weight - minW) / span;
              const y = normalized * 60 + 20;
              return (
                <circle
                  key={d.date + idx}
                  cx={x}
                  cy={y}
                  r={1.5}
                  fill="#1d4ed8"
                />
              );
            })}
          </svg>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              paddingTop: 30,
              textAlign: "center",
            }}
          >
            No weight logs yet. Add today’s weight below to start your graph.
          </div>
        )}
      </div>

      {hasData && (
        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            color: "#6b7280",
          }}
        >
          Avg change per log:{" "}
          {changePerEntry > 0 ? "+" : ""}
          {changePerEntry.toFixed(2)} per entry.
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAddWeight();
        }}
        style={{
          marginTop: 4,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          type="number"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          placeholder="Today’s weight"
          step="0.1"
          style={{
            flex: 1,
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            padding: "6px 10px",
            fontSize: 13,
            outline: "none",
            background: "white",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "7px 14px",
            borderRadius: 999,
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            background: "#111827",
            color: "white",
            cursor: "pointer",
          }}
        >
          Log
        </button>
      </form>
    </div>
  );
}

// health / grocery deals (news)
function DealsCard({ deals, loading, error }) {
  const empty = !loading && !error && (!deals || deals.length === 0);

  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow:
          "0 18px 40px rgba(15,23,42,0.04), 0 0 0 1px rgba(209,213,219,0.7)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600 }}>Food & gym deals today</div>
      <div style={{ fontSize: 12, color: "#6b7280" }}>
        Live feed of grocery, meal, and gym discounts / articles around healthy
        living.
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          Checking today’s news…
        </div>
      )}

      {error && !loading && (
        <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 8 }}>
          {error}
        </div>
      )}

      {empty && (
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          No articles came back from <code>NewsAPI</code> yet.
          <br />
          <span style={{ fontSize: 11 }}>
            If this never changes, your <code>/api/deals</code> route probably
            isn’t using your NewsAPI key correctly.
          </span>
        </div>
      )}

      {!loading && !error && deals && deals.length > 0 && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {deals.slice(0, 4).map((d, i) => (
            <a
              key={i}
              href={d.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                padding: "8px 10px",
                borderRadius: 14,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#111827",
                  marginBottom: 2,
                }}
              >
                {d.title || "Article"}
              </div>
              {d.source && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                  }}
                >
                  {d.source.name || d.source}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- MAIN DASHBOARD ----------
export default function DashboardPage() {
  const [name, setName] = useState("friend");
  const [calorieTarget, setCalorieTarget] = useState(2200);
  const [proteinTarget, setProteinTarget] = useState(130);

  const [todayKcal, setTodayKcal] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [history, setHistory] = useState([]);

  const [weightHistory, setWeightHistory] = useState([]);
  const [weightInput, setWeightInput] = useState("");

  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dealsError, setDealsError] = useState("");

  // load baseline, log history, weight, deals
  useEffect(() => {
    if (typeof window === "undefined") return;

    // baseline (this is what makes Dashboard follow Baseline changes)
    try {
      const saved = JSON.parse(
        window.localStorage.getItem("nutrimindBaseline") || "{}"
      );

      if (saved?.name || saved?.username) {
        const firstName = String(saved.name || saved.username).split(" ")[0];
        setName(firstName || "friend");
      }

      // calorie target: explicit, or based on weight + goal
      let newCalTarget = saved?.calorieTarget;
      if (!newCalTarget && saved?.weightLbs) {
        const w = Number(saved.weightLbs);
        if (w > 0) {
          const maintenance = w * 14; // simple athlete rule
          const goalAdj =
            saved.goal === "lose" ? -400 : saved.goal === "gain" ? 300 : 0;
          newCalTarget = Math.round(maintenance + goalAdj);
        }
      }
      if (newCalTarget) setCalorieTarget(newCalTarget);

      // protein target: explicit or 0.8g per lb
      let newProtTarget = saved?.proteinTarget;
      if (!newProtTarget && saved?.weightLbs) {
        const w = Number(saved.weightLbs);
        if (w > 0) newProtTarget = Math.round(w * 0.8);
      }
      if (newProtTarget) setProteinTarget(newProtTarget);
    } catch {
      // ignore
    }

    // history from tracker
    try {
      const raw = window.localStorage.getItem("nutrimindHistory");
      if (raw) {
        const parsed = JSON.parse(raw);
        setHistory(parsed);

        const today = parsed.find((d) => d.date === todayKey());
        if (today) {
          setTodayKcal(today.kcal || 0);
          setTodayProtein(today.protein || 0);
        }
      }
    } catch {
      // ignore
    }

    // weight history
    try {
      const rawW = window.localStorage.getItem("nutrimindWeightHistory");
      if (rawW) {
        const parsed = JSON.parse(rawW);
        setWeightHistory(parsed);
      }
    } catch {
      // ignore
    }

    // deals from /api/deals
    const loadDeals = async () => {
      try {
        setLoadingDeals(true);
        setDealsError("");
        const res = await fetch("/api/deals");
        if (!res.ok) throw new Error("Failed to fetch deals");
        const data = await res.json();
        const list = data.deals || data.articles || [];
        setDeals(list);
      } catch (err) {
        console.error("Deals error:", err);
        setDealsError("Couldn’t load news right now.");
      } finally {
        setLoadingDeals(false);
      }
    };

    loadDeals();
  }, []);

  // add / update today’s weight
  const handleAddWeight = () => {
    if (typeof window === "undefined") return;
    const w = parseFloat(weightInput);
    if (!w || w <= 0) return;

    let next = [...weightHistory];
    const key = todayKey();
    const idx = next.findIndex((d) => d.date === key);
    if (idx >= 0) next[idx] = { ...next[idx], weight: w };
    else next.push({ date: key, weight: w });

    next.sort((a, b) => (a.date > b.date ? 1 : -1));
    if (next.length > 60) next = next.slice(next.length - 60);

    window.localStorage.setItem("nutrimindWeightHistory", JSON.stringify(next));
    setWeightHistory(next);
    setWeightInput("");
  };

  const kcalPct = calorieTarget ? (todayKcal / calorieTarget) * 100 : 0;
  const proteinPct = proteinTarget ? (todayProtein / proteinTarget) * 100 : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left,#fdfdfd 0,#f3f4f6 40%,#e5e7eb 100%)",
        padding: "32px 16px 48px",
        color: "#111827",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,system-ui,'SF Pro Text',sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* header with NM gradient logo (no vertical sidebar) */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                background:
                  "linear-gradient(135deg,#fb7185,#f97316)", // pink/orange
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "white",
                fontSize: 18,
                boxShadow: "0 14px 32px rgba(248,113,113,0.6)",
              }}
            >
              NM
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Analytics · NutriMind
              </div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                }}
              >
                Hey {name || "friend"}, here’s how today’s fuel lines up with
                your plan.
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  marginTop: 4,
                }}
              >
                We pull in your <span style={{ fontWeight: 500 }}>Daily Log</span>{" "}
                and <span style={{ fontWeight: 500 }}>Baseline</span> so this
                page always reflects your real training life.
              </p>
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              fontSize: 13,
              color: "#4b5563",
            }}
          >
            <div style={{ fontWeight: 500 }}>{formatDateLong()}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              NutriMind · Dashboard
            </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1.4fr)",
            gap: 20,
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* BIG TODAY CARD */}
            <div
              style={{
                borderRadius: 24,
                padding: 20,
                background:
                  "linear-gradient(135deg,#fb7185,#f97316,#fcd34d)",
                color: "white",
                boxShadow:
                  "0 28px 60px rgba(248,113,113,0.35), 0 0 0 1px rgba(248,250,252,0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      opacity: 0.9,
                      marginBottom: 4,
                    }}
                  >
                    Today · total fuel
                  </div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {todayKcal} kcal
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      opacity: 0.92,
                    }}
                  >
                    out of {calorieTarget} kcal target ·{" "}
                    {Math.round(kcalPct || 0)}% of target
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      opacity: 0.9,
                    }}
                  >
                    Protein:{" "}
                    <strong>
                      {todayProtein} / {proteinTarget} g
                    </strong>{" "}
                    ({Math.round(proteinPct || 0)}% of target) logged via
                    Daily Log.
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: "rgba(15,23,42,0.18)",
                        border: "1px solid rgba(248,250,252,0.4)",
                      }}
                    >
                      Live from Daily Log
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 500,
                        background: "rgba(251,191,36,0.22)",
                        border: "1px solid rgba(254,249,195,0.7)",
                        color: "#111827",
                      }}
                    >
                      Keep this bar green most days, especially on hard
                      workouts.
                    </div>
                  </div>
                </div>

                {/* mini “percentage” donuts on right */}
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      minWidth: 110,
                      textAlign: "center",
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        height: 80,
                        width: 80,
                        borderRadius: "999px",
                        margin: "0 auto 6px",
                        border: "3px solid rgba(248,250,252,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {Math.round(kcalPct || 0)}%
                    </div>
                    <div style={{ opacity: 0.9 }}>Calories</div>
                  </div>
                  <div
                    style={{
                      minWidth: 110,
                      textAlign: "center",
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        height: 80,
                        width: 80,
                        borderRadius: "999px",
                        margin: "0 auto 6px",
                        border: "3px solid rgba(248,250,252,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {Math.round(proteinPct || 0)}%
                    </div>
                    <div style={{ opacity: 0.9 }}>Protein</div>
                  </div>
                </div>
              </div>
            </div>

            {/* weekly fuel card */}
            <WeeklyTrend history={history} calorieTarget={calorieTarget} />

            {/* bottom large nav buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 14,
              }}
            >
              {[
                {
                  label: "Daily Log",
                  desc: "Log meals & macros fast.",
                  href: "/tracker",
                },
                {
                  label: "AI Coach",
                  desc: "Ask questions, get advice.",
                  href: "/coach",
                },
                {
                  label: "Baseline",
                  desc: "Update goals & schedule.",
                  href: "/baseline",
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    color: "#111827",
                    background: "#0f172a",
                    borderRadius: 18,
                    padding: "12px 14px",
                    boxShadow:
                      "0 18px 40px rgba(15,23,42,0.55), 0 0 0 1px rgba(15,23,42,0.9)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      background:
                        item.label === "Daily Log"
                          ? "linear-gradient(135deg,#22c55e,#4ade80)"
                          : item.label === "AI Coach"
                          ? "linear-gradient(135deg,#38bdf8,#6366f1)"
                          : "linear-gradient(135deg,#fbbf24,#f97316)",
                      color: "#0b1120",
                    }}
                  >
                    {item.label
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "white",
                        marginBottom: 2,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#cbd5f5",
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <RingCard
              label="Calories"
              value={`${todayKcal} / ${calorieTarget} kcal`}
              subLabel="Fuel logged today vs target."
              percent={kcalPct}
              accent={
                kcalPct < 80 ? "#f97316" : kcalPct <= 110 ? "#22c55e" : "#fb923c"
              }
            />
            <RingCard
              label="Protein"
              value={`${todayProtein} / ${proteinTarget} g`}
              subLabel="Enough protein = better recovery on hard sessions."
              percent={proteinPct}
              accent={
                proteinPct < 80
                  ? "#38bdf8"
                  : proteinPct <= 110
                  ? "#2563eb"
                  : "#4f46e5"
              }
            />

            <WeightCard
              weightHistory={weightHistory}
              onAddWeight={handleAddWeight}
              weightInput={weightInput}
              setWeightInput={setWeightInput}
            />
            <DealsCard
              deals={deals}
              loading={loadingDeals}
              error={dealsError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
