"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "nutrimind_profile_v1";

const containerStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #eef1f5 0%, #f7f8fa 45%, #ffffff 100%)",
  padding: "32px 16px 48px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, system-ui, "SF Pro Text", sans-serif',
  color: "#1e293b",
};

const shellStyle = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const sectionCard = {
  background: "rgba(255,255,255,0.90)",
  backdropFilter: "blur(18px)",
  borderRadius: "22px",
  boxShadow: "0 20px 45px rgba(30,41,59,0.12)",
  border: "1px solid rgba(148,163,184,0.35)",
  padding: "26px 32px",
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState({
    name: "",
    role: "",
    sport: "",
    position: "",
    mainGoal: "",
    weightLb: "",
    heightCm: "",
    trainingDays: "",
    foodBudget: "",
    constraints: "",
  });

  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load saved profile
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setProfile((p) => ({ ...p, ...saved.data }));
        setLastSaved(saved.lastSaved);
      }
    } catch (err) {
      console.error("Failed loading profile:", err);
    }
  }, []);

  // Derived metrics
  const derived = useMemo(() => {
    const weight = Number(profile.weightLb) || 0;
    const days = Number(profile.trainingDays) || 0;

    const proteinLow = weight ? Math.round(weight * 0.7) : 0;
    const proteinHigh = weight ? Math.round(weight * 1.0) : 0;

    let calories = 0;
    if (weight) calories = Math.round(weight * (14 + days * 0.6));

    const trainingLabel =
      days === 0
        ? "Not training"
        : days <= 2
        ? "Light training"
        : days <= 4
        ? "Moderate training"
        : "High training load";

    return { proteinLow, proteinHigh, calories, trainingLabel };
  }, [profile.weightLb, profile.trainingDays]);

  function update(key, value) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function saveProfile() {
    try {
      setSaving(true);

      const stamp = new Date().toISOString();
      const payload = { data: profile, lastSaved: stamp };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSaved(stamp);

      setTimeout(() => setSaving(false), 350);
    } catch (err) {
      console.error("Save failed:", err);
      setSaving(false);
    }
  }

  const displayName = profile.name || "Athlete";
  const displayRole = profile.role || "Human in progress";

  function formatDate(iso) {
    if (!iso) return "Not saved";
    const d = new Date(iso);
    return d.toLocaleString();
  }

  return (
    <div style={containerStyle}>
      <div style={shellStyle}>
        {/* HEADER */}
        <header style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              color: "#64748b",
              letterSpacing: "0.14em",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            NutriMind AI
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 4,
            }}
          >
            Your baseline that powers every coaching answer.
          </h1>

          <p style={{ maxWidth: 580, color: "#475569", fontSize: 15 }}>
            Set this once. Every meal plan, macro breakdown, and training
            suggestion will use this in the background.
          </p>

          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: 18,
              borderRadius: 999,
              padding: "8px 16px",
              border: "1px solid rgba(148,163,184,0.6)",
              background: "white",
              color: "#1e293b",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            ← Back to coach
          </button>
        </header>

        {/* MAIN CARD */}
        <section style={sectionCard}>
          {/* PROFILE HERO */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginBottom: 16,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #1e293b, #334155, #0f766e)",
                color: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {displayName[0]?.toUpperCase()}
            </div>

            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {displayName}
              </div>

              <div
                style={{
                  marginTop: 2,
                  color: "#64748b",
                  fontSize: 14,
                }}
              >
                {displayRole}
                {profile.sport &&
                  ` · ${profile.sport} ${
                    profile.position ? `· ${profile.position}` : ""
                  }`}
              </div>
            </div>

            {/* Last saved */}
            <div style={{ marginLeft: "auto", fontSize: 13, color: "#64748b" }}>
              <strong style={{ color: "#334155" }}>Baseline status:</strong>
              <div>{formatDate(lastSaved)}</div>
            </div>
          </div>

          {/* TAG ROW – GOAL / TRAINING / BUDGET */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <InfoTag
              icon="🎯"
              label={
                profile.mainGoal
                  ? `Goal: ${profile.mainGoal}`
                  : "Goal: set a 3–6 month win"
              }
            />
            <InfoTag
              icon="🏋️"
              label={
                profile.trainingDays
                  ? `${derived.trainingLabel} · ${profile.trainingDays} days/week`
                  : "Training: add days/week"
              }
            />
            <InfoTag
              icon="💸"
              label={
                profile.foodBudget
                  ? `Budget: ${profile.foodBudget}`
                  : "Budget: set how flexible you are"
              }
            />
          </div>

          {/* METRICS BAND */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 18,
              padding: "18px 20px",
              border: "1px solid rgba(203,213,225,0.6)",
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            <MetricBlock
              label="Daily protein target"
              value={
                derived.proteinLow
                  ? `${derived.proteinLow}–${derived.proteinHigh} g`
                  : "—"
              }
            />
            <MetricBlock
              label="Estimated calories"
              value={derived.calories ? `${derived.calories} kcal` : "—"}
            />
            <MetricBlock
              label="Training load"
              value={
                profile.trainingDays
                  ? `${profile.trainingDays} days/week`
                  : "—"
              }
            />
          </div>

          {/* FORM FIELDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
              marginBottom: 24,
            }}
          >
            <TextField
              label="Name / nickname"
              value={profile.name}
              placeholder="Omar, Coach, Big O, etc."
              onChange={(v) => update("name", v)}
            />

            <TextField
              label="You are mostly..."
              value={profile.role}
              placeholder="Student, athlete, parent..."
              onChange={(v) => update("role", v)}
            />

            <TextField
              label="Main sport"
              value={profile.sport}
              placeholder="400H, soccer, none..."
              onChange={(v) => update("sport", v)}
            />

            <TextField
              label="Position / event"
              value={profile.position}
              placeholder="WR, RB, 400H, winger..."
              onChange={(v) => update("position", v)}
            />

            <TextField
              label="Main goal (3–6 months)"
              value={profile.mainGoal}
              placeholder="Build muscle, drop 10 lb, run sub-50..."
              onChange={(v) => update("mainGoal", v)}
            />

            <TextField
              label="Bodyweight (lb)"
              value={profile.weightLb}
              type="number"
              placeholder="155"
              onChange={(v) => update("weightLb", v)}
            />

            <TextField
              label="Height (cm)"
              value={profile.heightCm}
              type="number"
              placeholder="175"
              onChange={(v) => update("heightCm", v)}
            />

            <TextField
              label="Training days/week"
              value={profile.trainingDays}
              type="number"
              placeholder="4–6"
              onChange={(v) => update("trainingDays", v)}
            />

            <TextField
              label="Food budget mood"
              value={profile.foodBudget}
              placeholder="Tight, medium, flexible"
              onChange={(v) => update("foodBudget", v)}
            />
          </div>

          <TextAreaField
            label="Constraints NutriMind must respect"
            value={profile.constraints}
            placeholder="Late practices, sensitive stomach, fasting, early school..."
            onChange={(v) => update("constraints", v)}
          />

          {/* BUTTONS */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 26,
              gap: 12,
            }}
          >
            <button
              onClick={saveProfile}
              style={{
                padding: "10px 20px",
                background:
                  "linear-gradient(135deg, #1e293b, #334155, #0f766e)",
                color: "white",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {saving ? "Saving..." : "Save baseline"}
            </button>

            <button
              onClick={() => {
                saveProfile();
                setTimeout(() => router.push("/"), 300);
              }}
              style={{
                padding: "10px 20px",
                background: "white",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.5)",
                color: "#1e293b",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Save & return to coach
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* SMALL REUSABLE COMPONENTS */

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "#475569",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 14,
          border: "1px solid rgba(148,163,184,0.6)",
          padding: "10px 14px",
          outline: "none",
          fontSize: 14,
          color: "#1e293b",
          background: "#f8fafc",
        }}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginTop: 4 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "#475569",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.6)",
          padding: "12px 14px",
          outline: "none",
          fontSize: 14,
          color: "#1e293b",
          background: "#f8fafc",
          resize: "vertical",
        }}
      />
    </div>
  );
}

function MetricBlock({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div
        style={{
          textTransform: "uppercase",
          fontSize: 11,
          letterSpacing: "0.14em",
          fontWeight: 600,
          color: "#64748b",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoTag({ icon, label }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        background:
          "linear-gradient(135deg, rgba(15,118,110,0.08), rgba(15,23,42,0.04))",
        border: "1px solid rgba(148,163,184,0.5)",
        fontSize: 13,
        color: "#0f172a",
        fontWeight: 500,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
