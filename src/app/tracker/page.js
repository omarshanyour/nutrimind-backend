"use client";

import { useEffect, useState } from "react";

const formatDate = (d = new Date()) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// --- helper to parse water text into ounces ---
function parseWaterToOz(text) {
  const t = text.toLowerCase();
  let total = 0;
  let matchedUnit = false;

  const number = (s) => parseFloat(s.replace(",", "."));

  // cups
  const cupMatches = [...t.matchAll(/(\d+(\.\d+)?)\s*(cups?|c|glass|glasses)/g)];
  if (cupMatches.length) {
    matchedUnit = true;
    for (const m of cupMatches) {
      total += number(m[1]) * 8; // 1 cup/glass ≈ 8 oz
    }
  }

  // ounces
  const ozMatches = [...t.matchAll(/(\d+(\.\d+)?)\s*(oz|ounce|ounces)/g)];
  if (ozMatches.length) {
    matchedUnit = true;
    for (const m of ozMatches) {
      total += number(m[1]);
    }
  }

  // ml
  const mlMatches = [...t.matchAll(/(\d+(\.\d+)?)\s*(ml|milliliter|milliliters)/g)];
  if (mlMatches.length) {
    matchedUnit = true;
    for (const m of mlMatches) {
      total += number(m[1]) * 0.033814; // ml → oz
    }
  }

  // bottles (assume 16 oz each)
  const bottleMatches = [...t.matchAll(/(\d+(\.\d+)?)\s*(bottle|bottles|btl)/g)];
  if (bottleMatches.length) {
    matchedUnit = true;
    for (const m of bottleMatches) {
      total += number(m[1]) * 16;
    }
  }

  // If we saw a number but no units, assume cups.
  if (!matchedUnit) {
    const numMatch = t.match(/(\d+(\.\d+)?)/);
    if (numMatch) {
      total += number(numMatch[1]) * 8;
    }
  }

  return Math.round(total);
}

export default function TrackerPage() {
  // baseline targets (pulled from localStorage if available)
  const [calorieTarget, setCalorieTarget] = useState(2200);
  const [proteinTarget, setProteinTarget] = useState(130); // used for %
  const [proteinRange, setProteinRange] = useState(null); // {low, high} if we have a range

  // hydration
  const [hydrationTarget, setHydrationTarget] = useState(80); // oz
  const [hydrationToday, setHydrationToday] = useState(0);

  // today totals
  const [totalKcal, setTotalKcal] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);

  // meal form (text + macros)
  const [description, setDescription] = useState("");
  const [mealKcal, setMealKcal] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealFats, setMealFats] = useState("");

  const [meals, setMeals] = useState([]);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  // --- NEW: photo-based estimation state ---
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [loadingPhotoEstimate, setLoadingPhotoEstimate] = useState(false);

  // water form
  const [waterText, setWaterText] = useState("");
  const [waterError, setWaterError] = useState("");

  // last 7 days history for graph (still used for other parts of app)
  const [history, setHistory] = useState([]);

  // ----- Load baseline + history on mount -----
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ---- BASELINE ----
    try {
      // try a few common keys just in case baseline saved with a different name
      const rawBaseline =
        window.localStorage.getItem("nutrimindBaseline") ||
        window.localStorage.getItem("nutrimind-baseline") ||
        window.localStorage.getItem("nutrimind_profile");

      if (rawBaseline) {
        const saved = JSON.parse(rawBaseline);

        // calories: prefer estimatedCalories if present
        if (saved?.estimatedCalories) {
          setCalorieTarget(Math.round(saved.estimatedCalories));
        } else if (saved?.calorieTarget) {
          setCalorieTarget(saved.calorieTarget);
        }

        // protein range: dailyProteinLow / dailyProteinHigh or proteinLow / proteinHigh
        const low =
          saved?.dailyProteinLow ??
          saved?.proteinLow ??
          null;
        const high =
          saved?.dailyProteinHigh ??
          saved?.proteinHigh ??
          null;

        if (typeof low === "number" && typeof high === "number" && high > 0) {
          setProteinRange({ low: Math.round(low), high: Math.round(high) });
          setProteinTarget((low + high) / 2); // midpoint for % calc
        } else if (saved?.proteinTarget) {
          setProteinTarget(saved.proteinTarget);
          setProteinRange(null);
        }

        // hydration target – if baseline stored bodyweight, set ≈ 0.5 oz / lb
        const bw =
          saved?.bodyweightLb ??
          saved?.bodyWeightLb ??
          saved?.bodyweight ??
          saved?.weightLb;

        if (typeof bw === "number" && bw > 0) {
          setHydrationTarget(Math.round(bw * 0.5));
        } else if (saved?.hydrationTargetOz) {
          setHydrationTarget(saved.hydrationTargetOz);
        }
      }
    } catch {
      // ignore
    }

    // ---- HISTORY (food) ----
    try {
      const raw = window.localStorage.getItem("nutrimindHistory");
      if (raw) {
        const parsed = JSON.parse(raw);
        setHistory(parsed);

        const today = parsed.find((d) => d.date === todayKey());
        if (today) {
          setTotalKcal(today.kcal || 0);
          setTotalProtein(today.protein || 0);
        }
      }
    } catch {
      // ignore
    }

    // ---- HYDRATION TODAY ----
    try {
      const rawH = window.localStorage.getItem("nutrimindHydrationToday");
      if (rawH) {
        const parsed = JSON.parse(rawH);
        if (parsed.date === todayKey()) {
          setHydrationToday(parsed.oz || 0);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // ---- sync summary for dashboard ----
  // This is what the dashboard reads from localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const summary = {
      date: todayKey(),
      calories: totalKcal || 0,
      protein_g: totalProtein || 0,
      targetCalories: calorieTarget || 0,
      targetProtein_g: proteinTarget || 0,
      hydrationOz: hydrationToday || 0,
      hydrationTargetOz: hydrationTarget || 0,
    };

    try {
      window.localStorage.setItem(
        "nutrimind-today-summary",
        JSON.stringify(summary)
      );
    } catch (err) {
      console.error("Error saving dashboard summary:", err);
    }
  }, [totalKcal, totalProtein, calorieTarget, proteinTarget, hydrationToday, hydrationTarget]);

  // ----- Save history helper -----
  const saveHistory = (newTotalKcal, newTotalProtein) => {
    if (typeof window === "undefined") return;

    let next = [];
    try {
      next = JSON.parse(window.localStorage.getItem("nutrimindHistory") || "[]");
    } catch {
      next = [];
    }

    const key = todayKey();
    const existingIndex = next.findIndex((d) => d.date === key);

    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...next[existingIndex],
        kcal: newTotalKcal,
        protein: newTotalProtein,
      };
    } else {
      next.push({
        date: key,
        kcal: newTotalKcal,
        protein: newTotalProtein,
      });
    }

    // keep only last 7 days
    next.sort((a, b) => (a.date > b.date ? 1 : -1));
    if (next.length > 7) next = next.slice(next.length - 7);

    window.localStorage.setItem("nutrimindHistory", JSON.stringify(next));
    setHistory(next);
  };

  // ----- AI estimate button (text description → macros) -----
  const handleEstimate = async () => {
    if (!description.trim()) return;

    setEstimateError("");
    setLoadingEstimate(true);

    try {
      const res = await fetch("/api/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          // optional: tell backend we want chain-level accuracy
          mode: "high_precision",
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setEstimateError(
          data.message ||
            "I couldn't estimate that meal. Try adding restaurant + size."
        );
        return;
      }

      setMealKcal(String(Math.round(data.kcal || 0)));
      setMealProtein(String(Math.round(data.protein_g || 0)));
      setMealCarbs(String(Math.round(data.carbs_g || 0)));
      setMealFats(String(Math.round(data.fats_g || 0)));
    } catch (err) {
      console.error("Estimate error:", err);
      setEstimateError(
        "Server error estimating that meal. Try again in a moment."
      );
    } finally {
      setLoadingEstimate(false);
    }
  };

  // ----- NEW: photo change handler -----
  const handlePhotoChange = (e) => {
    setPhotoError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose a photo or screenshot (image file).");
      return;
    }

    // Optional: 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image is too large. Try a photo under 5 MB.");
      return;
    }

    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  // ----- NEW: send photo to AI for macro estimate -----
  const handleEstimateFromPhoto = async () => {
    if (!photoFile) {
      setPhotoError("Snap or upload a photo first.");
      return;
    }

    setPhotoError("");
    setLoadingPhotoEstimate(true);

    try {
      const formData = new FormData();
      // send under both names so backend can read either one
      formData.append("file", photoFile);
      formData.append("image", photoFile);

      const res = await fetch("/api/meal-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setPhotoError(
          data.message ||
            "I couldn't read that meal from the photo. Try a clearer angle, and make sure the full plate is visible."
        );
        return;
      }

      if (data.kcal != null) setMealKcal(String(Math.round(data.kcal)));
      if (data.protein_g != null)
        setMealProtein(String(Math.round(data.protein_g)));
      if (data.carbs_g != null)
        setMealCarbs(String(Math.round(data.carbs_g)));
      if (data.fats_g != null)
        setMealFats(String(Math.round(data.fats_g)));

      if (data.description) {
        setDescription(data.description);
      }
    } catch (err) {
      console.error("Photo estimate error:", err);
      setPhotoError("Server error while reading the photo. Try again.");
    } finally {
      setLoadingPhotoEstimate(false);
    }
  };

  // ----- Add food to today -----
  const handleAddToDay = () => {
    const kcalNum = Number(mealKcal) || 0;
    const proteinNum = Number(mealProtein) || 0;
    const carbsNum = Number(mealCarbs) || 0;
    const fatsNum = Number(mealFats) || 0;

    if (!kcalNum && !proteinNum && !carbsNum && !fatsNum) return;

    const newMeal = {
      id: Date.now(),
      description: description.trim() || "Meal",
      kcal: kcalNum,
      protein: proteinNum,
      carbs: carbsNum,
      fats: fatsNum,
    };

    const newMeals = [...meals, newMeal];
    setMeals(newMeals);

    const newTotalKcal = totalKcal + kcalNum;
    const newTotalProtein = totalProtein + proteinNum;

    setTotalKcal(newTotalKcal);
    setTotalProtein(newTotalProtein);
    saveHistory(newTotalKcal, newTotalProtein);

    // clear numbers, keep text
    setMealKcal("");
    setMealProtein("");
    setMealCarbs("");
    setMealFats("");
  };

  // ----- Add water with "AI" (client parsing) -----
  const handleAddWater = () => {
    setWaterError("");
    if (!waterText.trim()) return;

    const oz = parseWaterToOz(waterText);
    if (!oz || oz <= 0) {
      setWaterError(
        "I couldn’t find an amount of water. Try “2 cups of water” or “16 oz bottle”."
      );
      return;
    }

    const newHydration = hydrationToday + oz;
    setHydrationToday(newHydration);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          "nutrimindHydrationToday",
          JSON.stringify({ date: todayKey(), oz: newHydration })
        );
      } catch {
        // ignore
      }
    }

    setWaterText("");
  };

  // progress percentages
  const kcalPct = Math.min(150, (totalKcal / calorieTarget) * 100 || 0);
  const proteinPct = Math.min(150, (totalProtein / proteinTarget) * 100 || 0);
  const hydrationPct = Math.min(
    150,
    (hydrationToday / hydrationTarget) * 100 || 0
  );

  // --- build safe history for graph ---
  const safeHistory =
    history && history.length
      ? history
      : [
          { date: todayKey(), kcal: totalKcal, protein: totalProtein },
          { date: "d-2", kcal: 0, protein: 0 },
          { date: "d-3", kcal: 0, protein: 0 },
          { date: "d-4", kcal: 0, protein: 0 },
          { date: "d-5", kcal: 0, protein: 0 },
          { date: "d-6", kcal: 0, protein: 0 },
          { date: "d-7", kcal: 0, protein: 0 },
        ];

  // ---- zone logic for “today intake” graph ----
  const calorieZone = (() => {
    const pct = (totalKcal / calorieTarget) * 100 || 0;

    if (pct === 0) {
      return {
        label: "No data yet",
        color: "#e5e7eb",
        pct: 5,
      };
    }
    if (pct < 60) {
      return {
        label: "Red zone – under-fueled",
        color: "#f87171",
        pct: pct,
      };
    }
    if (pct < 80) {
      return {
        label: "Yellow – a bit light",
        color: "#facc15",
        pct: pct,
      };
    }
    if (pct <= 110) {
      return {
        label: "Green – right in the pocket",
        color: "#22c55e",
        pct: pct,
      };
    }
    if (pct <= 130) {
      return {
        label: "Yellow – heavy but ok",
        color: "#facc15",
        pct: pct > 130 ? 130 : pct,
      };
    }
    return {
      label: "Red – way over target",
      color: "#fb923c",
      pct: Math.min(pct, 150),
    };
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #f5f5f4 0, #f3f4f6 40%, #e5e7eb 100%)",
        padding: "32px 16px 48px",
        color: "#111827",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: 4,
              }}
            >
              NUTRIMIND AI · DAILY LOG
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.03em",
              }}
            >
              Daily fuel for your training lane.
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              Log what you eat and drink. NutriMind handles the numbers.
            </p>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#4b5563",
              textAlign: "right",
            }}
          >
            <div style={{ fontWeight: 500 }}>{formatDate()}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Today</div>
          </div>
        </header>

        {/* Layout: left main + right graph */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.2fr) minmax(260px, 1.2fr)",
            gap: 24,
          }}
        >
          {/* LEFT SIDE: log + meals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Summary card */}
            <section
              style={{
                background: "#f9fafb",
                borderRadius: 24,
                padding: "16px 20px",
                boxShadow:
                  "0 18px 40px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(148, 163, 184, 0.3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                {/* Calories */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      color: "#6b7280",
                    }}
                  >
                    Calories
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                      }}
                    >
                      {totalKcal} kcal
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      Target {calorieTarget} kcal
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#e5e7eb",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, kcalPct)}%`,
                        height: "100%",
                        borderRadius: 999,
                        background:
                          "linear-gradient(90deg,#fb923c,#f97316,#fb7185)", // orange / pink
                        transition: "width 0.25s ease-out",
                      }}
                    />
                  </div>
                </div>

                {/* Protein */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      color: "#6b7280",
                    }}
                  >
                    Protein
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                      }}
                    >
                      {totalProtein} g
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      Target{" "}
                      {proteinRange
                        ? `${proteinRange.low}–${proteinRange.high}`
                        : proteinTarget}{" "}
                      g
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#e5e7eb",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, proteinPct)}%`,
                        height: "100%",
                        borderRadius: 999,
                        background:
                          proteinPct >= 90 && proteinPct <= 110
                            ? "linear-gradient(90deg,#38bdf8,#2563eb)"
                            : "linear-gradient(90deg,#a855f7,#6366f1)",
                        transition: "width 0.25s ease-out",
                      }}
                    />
                  </div>
                </div>

                {/* Hydration */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      color: "#6b7280",
                    }}
                  >
                    Hydration
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                      }}
                    >
                      {hydrationToday} oz
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      Target {hydrationTarget} oz
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#e5e7eb",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, hydrationPct)}%`,
                        height: "100%",
                        borderRadius: 999,
                        background:
                          "linear-gradient(90deg,#38bdf8,#0ea5e9,#22d3ee)",
                        transition: "width 0.25s ease-out",
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Add meal card */}
            <section
              style={{
                background: "#f9fafb",
                borderRadius: 24,
                padding: "18px 20px 20px",
                boxShadow:
                  "0 18px 40px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(148, 163, 184, 0.25)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Add what you ate
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 10,
                }}
              >
                Type something like{" "}
                <span style={{ fontStyle: "italic" }}>
                  “In-N-Out Double-Double, fries, medium Coke”
                </span>{" "}
                or{" "}
                <span style={{ fontStyle: "italic" }}>
                  “3 eggs, 2 slices sourdough, avocado”.
                </span>
              </p>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your meal..."
                rows={3}
                style={{
                  width: "100%",
                  borderRadius: 18,
                  border: "1px solid #e5e7eb",
                  padding: "10px 12px",
                  fontSize: 14,
                  resize: "vertical",
                  outline: "none",
                  background: "white",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handleEstimate}
                  disabled={loadingEstimate || !description.trim()}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    background: loadingEstimate ? "#9ca3af" : "#047857",
                    color: "white",
                    cursor:
                      loadingEstimate || !description.trim()
                        ? "not-allowed"
                        : "pointer",
                    boxShadow: "0 10px 25px rgba(16, 185, 129, 0.35)",
                    transition:
                      "transform .1s ease-out, box-shadow .1s ease-out",
                  }}
                >
                  {loadingEstimate ? "Thinking…" : "Estimate with AI"}
                </button>
                <span
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  I’ll fill calories, protein, carbs, and fats for you.
                </span>
              </div>

              {estimateError && (
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#b91c1c",
                  }}
                >
                  {estimateError}
                </p>
              )}

              {/* --- NEW: photo-based estimate block --- */}
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px dashed #e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Or snap a photo of your meal
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 8,
                  }}
                >
                  On your phone this will open the camera. I’ll look at the plate
                  and estimate calories, protein, carbs, and fats — even for
                  restaurants like In-N-Out, Chipotle, or McDonald’s.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      padding: "7px 12px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                      cursor: "pointer",
                      background:
                        "linear-gradient(135deg,#fee2e2,#ffedd5,#fce7f3)",
                    }}
                  >
                    📸 Take / choose photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: "none" }}
                      onChange={handlePhotoChange}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleEstimateFromPhoto}
                    disabled={!photoFile || loadingPhotoEstimate}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 999,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        !photoFile || loadingPhotoEstimate
                          ? "#9ca3af"
                          : "linear-gradient(135deg,#fb7185,#f97316)",
                      color: "white",
                      cursor:
                        !photoFile || loadingPhotoEstimate
                          ? "not-allowed"
                          : "pointer",
                      boxShadow:
                        !photoFile || loadingPhotoEstimate
                          ? "none"
                          : "0 10px 24px rgba(248,113,113,0.45)",
                    }}
                  >
                    {loadingPhotoEstimate ? "Reading photo…" : "Estimate from photo"}
                  </button>

                  {photoFile && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                      }}
                    >
                      Selected: {photoFile.name}
                    </span>
                  )}
                </div>

                {photoPreview && (
                  <div
                    style={{
                      marginTop: 8,
                      borderRadius: 16,
                      overflow: "hidden",
                      border: "1px solid #e5e7eb",
                      maxWidth: 220,
                    }}
                  >
                    <img
                      src={photoPreview}
                      alt="Meal preview"
                      style={{ display: "block", width: "100%", height: "auto" }}
                    />
                  </div>
                )}

                {photoError && (
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#b91c1c",
                    }}
                  >
                    {photoError}
                  </p>
                )}

                <p
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  Photo estimates are approximate, but I’ll aim for the closest
                  real-world values using typical restaurant + portion data.
                </p>
              </div>

              {/* Macros row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <MacroInput
                  label="kcal"
                  value={mealKcal}
                  onChange={setMealKcal}
                />
                <MacroInput
                  label="protein g"
                  value={mealProtein}
                  onChange={setMealProtein}
                />
                <MacroInput
                  label="carbs g"
                  value={mealCarbs}
                  onChange={setMealCarbs}
                />
                <MacroInput
                  label="fats g"
                  value={mealFats}
                  onChange={setMealFats}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handleAddToDay}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#111827",
                    color: "white",
                    cursor: "pointer",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.4)",
                  }}
                >
                  Add to today
                </button>
                <span
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  We’ll keep the last 7 days so you can see streaks, not just
                  one perfect day.
                </span>
              </div>

              {/* Add water with AI */}
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 14,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Add water with AI
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 8,
                  }}
                >
                  Type something like{" "}
                  <span style={{ fontStyle: "italic" }}>
                    “2 cups of water”, “16 oz bottle”, or “500 ml”.
                  </span>{" "}
                  I’ll figure out the ounces and add it to hydration.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    value={waterText}
                    onChange={(e) => setWaterText(e.target.value)}
                    placeholder="e.g. 2 cups of water"
                    style={{
                      flex: 1,
                      minWidth: 180,
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      padding: "8px 12px",
                      fontSize: 13,
                      background: "white",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddWater}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      background: "#0ea5e9",
                      color: "white",
                      cursor: "pointer",
                      boxShadow: "0 10px 24px rgba(14,165,233,0.4)",
                    }}
                  >
                    Add water
                  </button>
                </div>
                {waterError && (
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#b91c1c",
                    }}
                  >
                    {waterError}
                  </p>
                )}
                <p
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Today: <strong>{hydrationToday}</strong> /{" "}
                  <strong>{hydrationTarget}</strong> oz logged.
                </p>
              </div>
            </section>

            {/* Today's meals */}
            <section
              style={{
                background: "#f9fafb",
                borderRadius: 24,
                padding: "16px 20px",
                boxShadow:
                  "0 16px 36px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(148, 163, 184, 0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 6,
                }}
              >
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Today’s meals
                </h2>
                <span
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  {totalKcal} kcal · {totalProtein} g protein
                </span>
              </div>

              {meals.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                  }}
                >
                  No meals logged yet. Start with breakfast, lunch, or whatever
                  you’ve already eaten today.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {meals.map((m) => (
                    <li
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 16,
                        background: "white",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          {m.description}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          {m.kcal} kcal · {m.protein} g P · {m.carbs} g C ·{" "}
                          {m.fats} g F
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* RIGHT SIDE: TODAY ZONE ONLY (7-day graph removed) */}
          <aside
            style={{
              background: "#f9fafb",
              borderRadius: 24,
              padding: "18px 18px 20px",
              boxShadow:
                "0 18px 40px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(148, 163, 184, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* TODAY ZONE GRAPH */}
            <div
              style={{
                marginTop: 4,
                paddingTop: 8,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Today’s intake zone
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 8,
                }}
              >
                See where today’s calories sit vs your target. Green = dialed
                in, yellow = a little light/heavy, red = off.
              </p>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg,#fee2e2 0%,#fef9c3 20%,#dcfce7 45%,#dcfce7 60%,#fef9c3 80%,#fee2e2 100%)",
                  height: 20,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(calorieZone.pct, 150)}%`,
                    background: calorieZone.color,
                    borderRadius: 999,
                    boxShadow: "0 0 0 1px rgba(15,23,42,0.12)",
                    transition: "width .2s ease-out",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: "rgba(31,41,55,0.25)",
                    transform: "translateX(-50%)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                <span>{Math.round(totalKcal)} kcal today</span>
                <span>{Math.round(calorieTarget)} kcal target</span>
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color:
                    calorieZone.color === "#22c55e"
                      ? "#15803d"
                      : calorieZone.color === "#facc15"
                      ? "#92400e"
                      : "#b91c1c",
                }}
              >
                {calorieZone.label}
              </div>

              <p
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: "#6b7280",
                  lineHeight: 1.4,
                }}
              >
                This bar refreshes every day. Use it to know if you’re
                under-fueled, on point, or way over for <strong>today</strong>.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MacroInput({ label, value, onChange }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: ".16em",
          color: "#9ca3af",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          padding: "6px 10px",
          fontSize: 13,
          background: "white",
          outline: "none",
        }}
      />
    </div>
  );
}
