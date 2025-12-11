"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nutrimind_baseline_v2";

const emptyBaseline = {
  name: "",
  role: "",
  mainSport: "",
  position: "",
  goalWindow: "3 MONTHS",
  mainGoal: "",
  bodyweight: "",
  height: "",
  trainingDays: "",
  foodBudget: "FLEXIBLE",
  constraints: "",
  favoriteFoods: "",
  culturalBackground: "",
  timeWindows: "",
  injuries: "",
};

function computeTargets(baseline) {
  const bodyweight = Number(baseline.bodyweight) || 0;
  const trainingDays = Number(baseline.trainingDays) || 0;

  // protein: 0.7–1.0 g / lb
  const minProtein = bodyweight ? Math.round(bodyweight * 0.7) : 0;
  const maxProtein = bodyweight ? Math.round(bodyweight * 1.0) : 0;

  // calories – rough estimate
  let calories = 0;
  if (bodyweight) {
    const base = bodyweight * 14; // moderate base
    if (trainingDays >= 5) calories = Math.round(base * 1.1);
    else if (trainingDays <= 2) calories = Math.round(base * 0.9);
    else calories = Math.round(base);
  }

  return { minProtein, maxProtein, calories };
}

export default function MyBaselinePage() {
  const [baseline, setBaseline] = useState(emptyBaseline);
  const [savedAt, setSavedAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setBaseline({ ...emptyBaseline, ...parsed });
        if (parsed._savedAt) setSavedAt(parsed._savedAt);
      } catch {
        // ignore bad JSON
      }
    }
  }, []);

  const { minProtein, maxProtein, calories } = computeTargets(baseline);

  function handleChange(field, value) {
    setBaseline((prev) => ({ ...prev, [field]: value }));
  }

  function applyChip(field, value) {
    setBaseline((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const timestamp = new Date().toLocaleString();

    // 1) Save the full baseline form
    const payload = { ...baseline, _savedAt: timestamp };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }

    // 2) Save a clean summary for Tracker / Coach
    const bodyweightLb = Number(baseline.bodyweight) || 0;
    const hydrationTargetOz = bodyweightLb ? Math.round(bodyweightLb * 0.5) : 80;

    const summary = {
      // calories
      estimatedCalories: calories || 0,
      calorieTarget: calories || 0,

      // protein range + midpoint
      dailyProteinLow: minProtein || 0,
      dailyProteinHigh: maxProtein || 0,
      proteinTarget:
        minProtein && maxProtein
          ? Math.round((minProtein + maxProtein) / 2)
          : 0,

      // bodyweight & hydration
      bodyweightLb,
      hydrationTargetOz,

      // identity info
      name: baseline.name || "",
      mainSport: baseline.mainSport || "",
      trainingDaysPerWeek: Number(baseline.trainingDays) || 0,
    };

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("nutrimindBaseline", JSON.stringify(summary));
      } catch {
        // ignore
      }
    }

    setSavedAt(timestamp);
    setTimeout(() => setSaving(false), 400);
  }

  const basicFilledCount = [
    baseline.name,
    baseline.role,
    baseline.mainSport,
    baseline.position,
  ].filter(Boolean).length;

  const bodyFilledCount = [
    baseline.bodyweight,
    baseline.height,
    baseline.trainingDays,
  ].filter(Boolean).length;

  const lifeFilledCount = [
    baseline.foodBudget,
    baseline.constraints,
    baseline.favoriteFoods,
    baseline.culturalBackground,
    baseline.timeWindows,
    baseline.injuries,
  ].filter(Boolean).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 16px 40px",
        display: "flex",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, #fef3c7 0, #fdf2f8 20%, #f3f4f6 55%, #e5e7eb 100%)",
        color: "#0f172a",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, width: "100%" }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              NUTRIMIND AI · BASELINE
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Set the version of you I’m coaching.
            </h1>
            <p
              style={{
                marginTop: 6,
                maxWidth: 540,
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              Answer this once. Every meal plan, macro breakdown, and training
              tweak will quietly use this in the background. Think of it like
              the form you fill before day one of practice.
            </p>
          </div>

          {/* Avatar + status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "999px",
                padding: 2,
                background:
                  "conic-gradient(from 140deg, #f97316, #fb7185, #ec4899, #f97316)",
                boxShadow: "0 16px 40px rgba(248,113,113,0.55)",
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
                {baseline.name ? baseline.name[0].toUpperCase() : "N"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {baseline.name || "New athlete"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                {baseline.role || "Who you are"} ·{" "}
                {baseline.mainSport || "No sport set yet"}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                {savedAt ? `Saved ${savedAt}` : "Not saved yet"}
              </div>
            </div>
          </div>
        </header>

        {/* SNAPSHOT STRIP */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.2fr)",
            gap: 14,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {/* Macro snapshot */}
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 20,
              padding: "14px 16px",
              boxShadow:
                "0 18px 40px rgba(148,163,184,0.35), 0 0 0 1px rgba(209,213,219,0.9)",
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: ".18em",
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Auto-calculated targets
              </div>
              <div
                style={{
                  fontSize: 14,
                  marginBottom: 4,
                  color: "#111827",
                }}
              >
                Once you set weight + training days, NutriMind locks in your
                default calories and protein.
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                You don’t have to pick numbers. Just tell me your bodyweight and
                training schedule — I’ll do the math.
              </p>
            </div>
            <div
              style={{
                borderRadius: 16,
                padding: 10,
                background:
                  "radial-gradient(circle at top right,#fee2e2,#fef3c7)",
                border: "1px solid #fed7aa",
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 6,
                fontSize: 12,
              }}
            >
              <SnapshotMini
                label="Daily protein"
                value={
                  minProtein && maxProtein
                    ? `${minProtein}–${maxProtein} g`
                    : "Add weight first"
                }
              />
              <SnapshotMini
                label="Estimated calories"
                value={calories ? `${calories} kcal` : "Add weight + days"}
              />
            </div>
          </div>

          {/* Mini step tracker */}
          <div
            style={{
              background: "#020617",
              borderRadius: 22,
              padding: "12px 14px",
              boxShadow:
                "0 20px 60px rgba(15,23,42,0.85), 0 0 0 1px rgba(15,23,42,0.9)",
              color: "#e5e7eb",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "#9ca3af",
              }}
            >
              3 quick passes · not homework
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 6,
                fontSize: 11,
              }}
            >
              <StepPill
                step="1"
                title="Who you are"
                done={basicFilledCount >= 2}
              />
              <StepPill
                step="2"
                title="Body & training"
                done={bodyFilledCount >= 2}
              />
              <StepPill
                step="3"
                title="Food & life"
                done={lifeFilledCount >= 2}
              />
            </div>
            <p
              style={{
                fontSize: 11,
                color: "#9ca3af",
                margin: 0,
                marginTop: 2,
              }}
            >
              You can leave anything blank. The more you fill, the smarter the
              plans — but it should feel like texting, not a test.
            </p>
          </div>
        </section>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1.2fr)",
            gap: 18,
          }}
        >
          {/* LEFT: basics + body & training */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* SECTION 1: WHO YOU ARE */}
            <section
              style={{
                background: "#ffffff",
                borderRadius: 22,
                padding: "16px 18px",
                boxShadow:
                  "0 18px 50px rgba(148,163,184,0.35), 0 0 0 1px rgba(229,231,235,0.9)",
              }}
            >
              <SectionHeader
                badge="Step 1"
                title="Who are you as an athlete / human?"
                subtitle="This helps responses sound like they’re actually for you, not some random person."
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <Field
                  label="Name or nickname"
                  placeholder="Mo, Omar, etc."
                  value={baseline.name}
                  onChange={(v) => handleChange("name", v)}
                />
                <Field
                  label="You are mostly..."
                  placeholder="Student, athlete, busy parent, etc."
                  value={baseline.role}
                  onChange={(v) => handleChange("role", v)}
                  chips={["Student", "Student-athlete", "Working + school"]}
                  onChipClick={(chip) => applyChip("role", chip)}
                />
                <Field
                  label="Main sport (or leave blank)"
                  placeholder="400H, WR, soccer winger, etc."
                  value={baseline.mainSport}
                  onChange={(v) => handleChange("mainSport", v)}
                  chips={["Track (400H)", "Soccer", "Football", "Gym/fitness"]}
                  onChipClick={(chip) => applyChip("mainSport", chip)}
                />
                <Field
                  label="Position / event"
                  placeholder="Cornerback, 300H, striker..."
                  value={baseline.position}
                  onChange={(v) => handleChange("position", v)}
                />
              </div>
            </section>

            {/* SECTION 2: BODY & TRAINING */}
            <section
              style={{
                background: "#ffffff",
                borderRadius: 22,
                padding: "16px 18px",
                boxShadow:
                  "0 18px 50px rgba(148,163,184,0.35), 0 0 0 1px rgba(229,231,235,0.9)",
              }}
            >
              <SectionHeader
                badge="Step 2"
                title="Body & training lane"
                subtitle="These 3 numbers power calories, protein, and hydration targets."
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <Field
                  label="Bodyweight (lb)"
                  type="number"
                  placeholder="e.g. 155"
                  value={baseline.bodyweight}
                  onChange={(v) => handleChange("bodyweight", v)}
                />
                <Field
                  label="Height (cm)"
                  type="number"
                  placeholder="Optional"
                  value={baseline.height}
                  onChange={(v) => handleChange("height", v)}
                />
                <Field
                  label="Training days per week"
                  type="number"
                  placeholder="e.g. 4"
                  value={baseline.trainingDays}
                  onChange={(v) => handleChange("trainingDays", v)}
                  chips={["3", "4", "5", "6"]}
                  onChipClick={(chip) => applyChip("trainingDays", chip)}
                />
                <Field
                  label="Food budget mood"
                  placeholder="Tight · Normal · Flexible"
                  value={baseline.foodBudget}
                  onChange={(v) => handleChange("foodBudget", v)}
                  chips={["Tight", "Normal", "Flexible"]}
                  onChipClick={(chip) => applyChip("foodBudget", chip)}
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                · Hydration target will auto-set around{" "}
                <strong>0.5 oz per lb</strong> of bodyweight.  
                · Training days help me know how aggressive to be with calories.
              </div>
            </section>
          </div>

          {/* RIGHT: goals + life context */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* GOAL CARD */}
            <section
              style={{
                background:
                  "linear-gradient(135deg,#f97316,#fb7185,#ec4899)",
                borderRadius: 22,
                padding: "16px 18px",
                color: "#f9fafb",
                boxShadow: "0 22px 60px rgba(248,113,113,0.75)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  opacity: 0.9,
                  marginBottom: 4,
                }}
              >
                Step 0 · Why are we doing this?
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                What’s the main goal we’re eating + training for?
              </div>
              <p
                style={{
                  fontSize: 12,
                  opacity: 0.95,
                  marginBottom: 10,
                }}
              >
                Be specific like you’re texting your coach: time goals, look
                goals, or how you want to feel.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <FieldDark
                  label="Goal horizon"
                  placeholder="3 MONTHS, 6 MONTHS..."
                  value={baseline.goalWindow}
                  onChange={(v) => handleChange("goalWindow", v)}
                  chips={["3 MONTHS", "6 MONTHS", "1 YEAR"]}
                  onChipClick={(chip) => applyChip("goalWindow", chip)}
                />
              </div>

              <TextAreaDark
                label="Main goal (next 3–6 months)"
                placeholder='e.g. "Drop 400m from 53 → 50", "Lose 10 lb while keeping speed", "Put on 8 lb of muscle".'
                value={baseline.mainGoal}
                onChange={(v) => handleChange("mainGoal", v)}
              />
            </section>

            {/* FOOD + LIFE CONTEXT */}
            <section
              style={{
                background: "#ffffff",
                borderRadius: 22,
                padding: "16px 18px",
                boxShadow:
                  "0 18px 50px rgba(148,163,184,0.35), 0 0 0 1px rgba(229,231,235,0.9)",
              }}
            >
              <SectionHeader
                badge="Step 3"
                title="Food, schedule & real-life constraints"
                subtitle="This keeps plans realistic so you actually follow them."
              />

              <TextAreaField
                label="Constraints NutriMind must respect"
                placeholder="Late practices, early school, can’t cook at lunch, stomach issues, Ramadan, etc."
                value={baseline.constraints}
                onChange={(v) => handleChange("constraints", v)}
              />

              <TextAreaField
                label="Favorite & go-to foods"
                placeholder="Stuff you actually eat: cereals, sandwiches, fast food spots, snacks, shakes."
                value={baseline.favoriteFoods}
                onChange={(v) => handleChange("favoriteFoods", v)}
              />

              <TextAreaField
                label="Cultural background & food preferences"
                placeholder="Halal, vegetarian, family dishes you want to keep in the plan, etc."
                value={baseline.culturalBackground}
                onChange={(v) => handleChange("culturalBackground", v)}
              />

              <TextAreaField
                label="Time windows & schedule"
                placeholder="When do you usually train? When can you realistically eat (before/after school, work, practice)?"
                value={baseline.timeWindows}
                onChange={(v) => handleChange("timeWindows", v)}
              />

              <TextAreaField
                label="Injuries / limitations NutriMind should know"
                placeholder="E.g., bad knee (no deep squats), elbow issues, shin splints, no spicy food at night, etc."
                value={baseline.injuries}
                onChange={(v) => handleChange("injuries", v)}
              />
            </section>

            {/* SAVE BUTTON */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                You can always edit this later. Think of it as your “locker room
                profile”.
              </span>
              <button
                type="submit"
                disabled={saving}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "9px 22px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg,#f97316,#fb7185,#ec4899)",
                  color: "white",
                  boxShadow: "0 16px 40px rgba(248,113,113,0.7)",
                  opacity: saving ? 0.85 : 1,
                }}
              >
                {saving ? "Saving..." : "Save baseline"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ---- SMALL COMPONENTS ---- */

function SnapshotMini({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: "6px 8px",
        background: "rgba(255,255,255,0.8)",
        border: "1px solid rgba(254,215,170,0.9)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: ".16em",
          color: "#92400e",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#7c2d12",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StepPill({ step, title, done }) {
  return (
    <div
      style={{
        borderRadius: 999,
        padding: "6px 8px",
        border: done
          ? "1px solid rgba(52,211,153,0.9)"
          : "1px solid rgba(55,65,81,0.8)",
        background: done ? "rgba(6,95,70,0.25)" : "rgba(15,23,42,0.9)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: ".16em",
          color: done ? "#bbf7d0" : "#9ca3af",
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            background: done ? "#22c55e" : "transparent",
            color: done ? "#022c22" : "#e5e7eb",
          }}
        >
          {done ? "✓" : step}
        </span>
        Step {step}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#e5e7eb",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function SectionHeader({ badge, title, subtitle }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: ".18em",
          color: "#9ca3af",
          marginBottom: 4,
        }}
      >
        {badge}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginTop: 2,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  chips,
  onChipClick,
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 500 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          borderRadius: 999,
          padding: "8px 12px",
          fontSize: 13,
          outline: "none",
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      />
      {chips && chips.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 2,
          }}
        >
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChipClick && onChipClick(chip)}
              style={{
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                padding: "3px 8px",
                fontSize: 11,
                background: "#f3f4f6",
                color: "#4b5563",
                cursor: "pointer",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginTop: 10,
      }}
    >
      <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 500 }}>
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          borderRadius: 16,
          padding: "10px 12px",
          fontSize: 13,
          outline: "none",
          resize: "vertical",
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      />
    </label>
  );
}

function FieldDark({ label, value, onChange, placeholder, chips, onChipClick }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#fee2e2", fontWeight: 500 }}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          borderRadius: 999,
          padding: "8px 12px",
          fontSize: 13,
          outline: "none",
          border: "1px solid rgba(254,242,242,0.6)",
          background: "rgba(15,23,42,0.25)",
          color: "#fefce8",
        }}
      />
      {chips && chips.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 2,
          }}
        >
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChipClick && onChipClick(chip)}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(254,249,195,0.8)",
                padding: "3px 8px",
                fontSize: 11,
                background: "rgba(15,23,42,0.35)",
                color: "#fefce8",
                cursor: "pointer",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function TextAreaDark({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#fee2e2", fontWeight: 500 }}>
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          borderRadius: 16,
          padding: "10px 12px",
          fontSize: 13,
          outline: "none",
          resize: "vertical",
          border: "1px solid rgba(254,242,242,0.6)",
          background: "rgba(15,23,42,0.25)",
          color: "#fefce8",
        }}
      />
    </label>
  );
}
