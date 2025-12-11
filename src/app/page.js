"use client";

import NavBar from "./NavBar";
import { useEffect, useState } from "react";

// ---------- helpers ----------
const todayKey = () => new Date().toISOString().slice(0, 10);
const formatDateLong = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ---------- shared small components ----------

// circular ring card (right column)
function RingCard({ label, value, subLabel, percent, accent }) {
  const size = 130;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePct = clamp(percent || 0, 0, 150);
  const offset = circumference - (safePct / 100) * circumference;

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
              transition: "stroke-dashoffset .3s ease-out",
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

// mini 7-day calories line
function WeeklyTrend({ history, calorieTarget }) {
  if (!history || history.length === 0) {
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
        Once you log in <strong>Daily Log</strong>, your last 7 days of
        calories will show here.
      </div>
    );
  }

  const sorted = [...history].sort((a, b) =>
    a.date > b.date ? 1 : a.date < b.date ? -1 : 0
  );
  const maxKcal = Math.max(
    calorieTarget || 1,
    ...sorted.map((d) => d.kcal || 0)
  );

  const points = sorted
    .map((d, idx) => {
      const x = sorted.length === 1 ? 10 : (idx / (sorted.length - 1)) * 90 + 5;
      const value = d.kcal || 0;
      const normalized = 1 - value / maxKcal;
      const y = normalized * 60 + 20;
      return `${x},${y}`;
    })
    .join(" ");

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
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        Last 7 days – calories
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
        You want this line hovering close to your target most of the week.
      </div>

      <div style={{ width: "100%", height: 130 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <line
            x1="0"
            y1="40"
            x2="100"
            y2="40"
            stroke="#e5e7eb"
            strokeWidth="0.6"
            strokeDasharray="3 3"
          />
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.7"
            points={points}
          />
          {sorted.map((d, idx) => {
            const x =
              sorted.length === 1 ? 10 : (idx / (sorted.length - 1)) * 90 + 5;
            const value = d.kcal || 0;
            const normalized = 1 - value / maxKcal;
            const y = normalized * 60 + 20;
            const isToday = d.date === todayKey();
            return (
              <circle
                key={d.date}
                cx={x}
                cy={y}
                r={isToday ? 1.8 : 1.3}
                fill={isToday ? "#0f172a" : "#22c55e"}
              />
            );
          })}
        </svg>
      </div>

      <div
        style={{
          marginTop: 4,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#9ca3af",
        }}
      >
        <span>{sorted[0]?.date}</span>
        <span>{sorted[sorted.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// news / deals (bottom-right)
function DealsCard({ deals, loading, error }) {
  // make sure `deals` is always an array so React never tries to render an object
  const safeDeals = Array.isArray(deals) ? deals : [];

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
      <div style={{ fontSize: 13, fontWeight: 600 }}>
        Food & gym deals + articles
      </div>
      <div style={{ fontSize: 12, color: "#6b7280" }}>
        Live feed of healthy-ish food, fitness, and recovery content.
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          Checking today’s feed…
        </div>
      )}

      {error && !loading && (
        <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 8 }}>
          {error}
        </div>
      )}

      {!loading && !error && safeDeals.length === 0 && (
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          No articles found right now. Once your News API key is wired correctly,
          they’ll appear here.
        </div>
      )}

      {!loading && !error && safeDeals.length > 0 && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {safeDeals.slice(0, 4).map((d, i) => (
            <a
              key={d.url || d.id || i}
              href={d.url || "#"}
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
                {d.title || d.name || "Article"}
              </div>
              {(d.source?.name || d.source) && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                  }}
                >
                  {d.source?.name || d.source}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// recovery / hydration / consistency row
function CircleMetricCard({
  title,
  valueText,
  score,
  theme,
  description,
  accent,
}) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePct = clamp(score || 0, 0, 100);
  const offset = circumference - (safePct / 100) * circumference;

  const bgMap = {
    recovery: "linear-gradient(135deg,#eef2ff,#e0f2fe)",
    hydration: "linear-gradient(135deg,#ecfeff,#dbeafe)",
    fuel: "linear-gradient(135deg,#fefce8,#fee2e2)",
  };

  return (
    <div
      style={{
        borderRadius: 20,
        padding: "14px 16px",
        background: bgMap[theme] || "#f9fafb",
        boxShadow:
          "0 16px 34px rgba(15,23,42,0.05), 0 0 0 1px rgba(209,213,219,0.7)",
        display: "flex",
        gap: 12,
        alignItems: "center",
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
            stroke={accent}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset .3s ease-out",
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
            fontSize: 11,
            color: "#111827",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {Math.round(safePct)}%
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>score</div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#4b5563",
            marginTop: 2,
          }}
        >
          {valueText}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginTop: 6,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>
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
  const [todayWaterOz, setTodayWaterOz] = useState(0);
  const [history, setHistory] = useState([]);

  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dealsError, setDealsError] = useState("");

  // scores
  const [recoveryScore, setRecoveryScore] = useState(0);
  const [hydrationScore, setHydrationScore] = useState(0);
  const [consistencyScore, setConsistencyScore] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // baseline
    try {
      const saved = JSON.parse(
        window.localStorage.getItem("nutrimindBaseline") || "{}"
      );
      if (saved?.name) {
        const firstName = String(saved.name).split(" ")[0];
        setName(firstName || "friend");
      } else {
        setName("friend");
      }
      if (saved?.calorieTarget) setCalorieTarget(saved.calorieTarget);
      if (saved?.proteinTarget) setProteinTarget(saved.proteinTarget);
    } catch {
      // ignore
    }

    // history from Daily Log
    try {
      const raw = window.localStorage.getItem("nutrimindHistory");
      if (raw) {
        const parsed = JSON.parse(raw);
        setHistory(parsed);

        const today = parsed.find((d) => d.date === todayKey());
        if (today) {
          setTodayKcal(today.kcal || 0);
          setTodayProtein(today.protein || 0);
          setTodayWaterOz(today.waterOz || 0);
        }
        computeScores(parsed);
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
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch deals");
        }

        // normalize to always be an array
        const list = Array.isArray(data)
          ? data
          : data.deals || data.articles || [];
        setDeals(list);
      } catch (err) {
        console.error("Deals error:", err);
        setDealsError("Couldn’t load articles right now.");
        setDeals([]);
      } finally {
        setLoadingDeals(false);
      }
    };

    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // compute recovery / hydration / consistency from last 7 days
  const computeScores = (allHistory) => {
    if (!allHistory || allHistory.length === 0) {
      setRecoveryScore(0);
      setHydrationScore(0);
      setConsistencyScore(0);
      return;
    }

    const sorted = [...allHistory].sort((a, b) =>
      a.date > b.date ? 1 : a.date < b.date ? -1 : 0
    );
    const last7 = sorted.slice(-7);

    // hydration score = today water vs 80oz (or whatever you want)
    const today = last7.find((d) => d.date === todayKey()) || {};
    const waterToday = today.waterOz || 0;
    const hydrationPct = clamp((waterToday / 80) * 100, 0, 130);
    setHydrationScore(hydrationPct);

    // fuel consistency score: how many days hit 80–115% of calorie target
    let onPlanDays = 0;
    last7.forEach((d) => {
      if (!d.kcal || !calorieTarget) return;
      const pct = (d.kcal / calorieTarget) * 100;
      if (pct >= 80 && pct <= 115) onPlanDays += 1;
    });
    const consistency = clamp((onPlanDays / last7.length) * 100, 0, 100);
    setConsistencyScore(consistency);

    // recovery score = blend of average calorie/protein % + hydration
    let avgCalPct = 0;
    let avgProtPct = 0;
    let daysWithData = 0;

    last7.forEach((d) => {
      if (d.kcal && calorieTarget) {
        avgCalPct += clamp((d.kcal / calorieTarget) * 100, 0, 140);
        daysWithData += 1;
      }
      if (d.protein && proteinTarget) {
        avgProtPct += clamp((d.protein / proteinTarget) * 100, 0, 140);
      }
    });

    if (daysWithData > 0) {
      avgCalPct /= daysWithData;
      avgProtPct /= daysWithData;
    }

    const baseRecovery = (avgCalPct * 0.45 + avgProtPct * 0.35) / 1.0;
    const combined = clamp(
      baseRecovery * 0.6 + hydrationPct * 0.4,
      0,
      120
    );
    setRecoveryScore(combined);
  };

  const kcalPct = calorieTarget ? (todayKcal / calorieTarget) * 100 : 0;
  const proteinPct = proteinTarget ? (todayProtein / proteinTarget) * 100 : 0;

  // friendly text for cards
  const recoveryText = (() => {
    if (recoveryScore >= 90)
      return "Great recovery – your fuel and hydration look on point.";
    if (recoveryScore >= 70)
      return "Recovery looks decent. Keep food quality high and keep hydrating.";
    if (recoveryScore >= 40)
      return "Recovery is a bit mid. Try to hit your calories, protein, and water 5+ days this week.";
    return "Recovery is low. Focus on eating enough, getting protein, and drinking water today.";
  })();

  const hydrationDesc = (() => {
    if (hydrationScore >= 90)
      return "Hydration is strong today. Keep a bottle near you and you’re set.";
    if (hydrationScore >= 70)
      return "Pretty solid – 1 more bottle gets you in a great spot.";
    if (hydrationScore >= 40)
      return "You’re part-way there. Sip through the afternoon instead of chugging at night.";
    return "Very low so far. Make water the first thing you drink at your next meal.";
  })();

  const consistencyDesc = (() => {
    if (consistencyScore >= 80)
      return "Nice. You’re eating like your plan most of the week.";
    if (consistencyScore >= 55)
      return "Some good days, some low days. Aim for 1 more on-plan day this week.";
    if (consistencyScore >= 30)
      return "Fuel is pretty up-and-down. Try to make breakfast or lunch more consistent.";
    return "Barely any on-plan days yet – totally okay, this just shows where to start.";
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left,#fdfdfd 0,#f3f4f6 40%,#e5e7eb 100%)",
        padding: "32px 16px 48px",
        color: "#111827",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui,'SF Pro Text',sans-serif",
      }}
    >
      {/* NAVBAR AT TOP */}
      <div style={{ maxWidth: 1200, margin: "0 auto 12px" }}>
        <NavBar />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 20,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
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
              Hey {name}, here’s how today’s fuel lines up with your plan.
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              We pull in your{" "}
              <span style={{ fontWeight: 500 }}>Daily Log</span> and{" "}
              <span style={{ fontWeight: 500 }}>Baseline</span> so this page
              always reflects your real training life.
            </p>
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

                {/* MINI PERCENT BUBBLES */}
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

            {/* WEEKLY TREND */}
            <WeeklyTrend history={history} calorieTarget={calorieTarget} />

            {/* NAV CARDS (bottom row like before) */}
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
            {/* CALORIE & PROTEIN RINGS */}
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

            {/* RECOVERY / HYDRATION / CONSISTENCY ROW */}
            <CircleMetricCard
              theme="recovery"
              title="Recovery score"
              valueText={`${Math.round(
                recoveryScore
              )}/100 · today’s readiness`}
              score={recoveryScore}
              accent="#4f46e5"
              description={recoveryText}
            />
            <CircleMetricCard
              theme="hydration"
              title="Hydration today"
              valueText={`${todayWaterOz} oz logged in Daily Log`}
              score={hydrationScore}
              accent="#0ea5e9"
              description={hydrationDesc}
            />
            <CircleMetricCard
              theme="fuel"
              title="Fuel consistency"
              valueText={`${Math.round(
                consistencyScore
              )}/100 · last 7 days`}
              score={consistencyScore}
              accent="#16a34a"
              description={consistencyDesc}
            />

            {/* NEWS / DEALS */}
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
