// src/app/api/route.js

import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

// ---------- OPENAI CLIENT ----------
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Simple in-memory sessions (per browser)
// NOTE: this resets when you restart the dev server – later you can move this to a DB.
const sessions = new Map();

// Get / create a session id from cookies
function getSessionId(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/nutrimind_session=([^;]+)/);

  if (match && match[1]) {
    return { id: match[1], isNew: false };
  }

  const newId =
    Math.random().toString(36).slice(2) + Date.now().toString(36);

  return { id: newId, isNew: true };
}

// -------- SYSTEM PROMPT BASE --------
const BASE_SYSTEM_PROMPT = `
You are NutriMind, an elite AI coach for nutrition, training, and lifestyle.

You help:
- Athletes of every sport (track, football, soccer, basketball, etc.)
- Lifters (strength, hypertrophy, power)
- Parents with busy schedules
- Students with limited time and money
- Anyone trying to build muscle, lose fat, perform better, or feel healthier.

Core rules:
- Be hype, positive, and real – like a smart, locked-in coach.
- Keep answers SHORT and punchy: usually 4–8 short sentences or a few bullet points.
- Give SPECIFIC, realistic advice (foods, portions, times, examples).
- Ask ONE smart follow-up at the end of most replies, unless the user says "no questions".
- Never repeat the same answer word-for-word.
- Remember the user’s sport, schedule, food preferences, and constraints within the session.
- If something sounds medical (injury, disease, meds, eating disorder), tell them politely to talk to a professional.

Nutrition knowledge (use flexibly, not as a script):
- Protein: about 0.7–1.0 g per lb of bodyweight per day.
- Spread protein across meals.
- Carbs near training (rice, oats, pasta, potatoes, fruit, bread, etc).
- Healthy fats (avocado, eggs, nuts, olive oil, fatty fish).
- Hydration: at least 2–3 L/day baseline, more on hot or hard training days.
- Pre-workout: easy-to-digest carbs + a little protein, low fat.
- Post-workout: solid protein + carbs within a few hours.
- Off days: still get protein, slightly fewer carbs.

Training knowledge:
- Speed / sprinting: acceleration, max-velocity, short hill sprints, plyometrics, full recoveries.
- Strength: progressive overload, good technique, rest days.
- Conditioning: intervals, tempo runs, zone 2.
- Recovery: sleep, deload weeks, mobility, stress management.

Tone:
- Motivating, encouraging, a little playful, but never cringe.
- Short paragraphs, bullets when helpful, no giant text walls.
`;

// ---------- HELPERS TO INJECT PROFILE / LOG DATA ----------
function buildSystemPrompt({ baseline, last7Days }) {
  let extra = "";

  if (baseline) {
    const {
      name,
      role,
      sport,
      position,
      mainGoal,
      bodyweight,
      height,
      trainingDaysPerWeek,
      foodBudget,
      constraints,
      estimatedCalories,
      proteinTargetMin,
      proteinTargetMax,
    } = baseline;

    extra += `
User profile (baseline):
- Name: ${name || "Unknown"}
- Identity: ${role || "Unknown"}
- Sport / lane: ${sport || "Unknown"}
- Position / event: ${position || "Unknown"}
- Main 3–6 month goal: ${mainGoal || "Unknown"}
- Body data: ${bodyweight || "?"} lb, ${height || "?"} cm
- Training load: ${trainingDaysPerWeek || "?"} days/week
- Food budget mood: ${foodBudget || "Unknown"}
- Target calories: ${estimatedCalories || "Unknown"} kcal/day
- Protein target: ${proteinTargetMin || "?"}–${proteinTargetMax || "?"} g/day
- Constraints / realities NutriMind must respect: ${constraints || "None specified"}

Use this baseline quietly in every answer. Do NOT repeat it every time,
but use it to make the coaching feel personal and realistic.
`;
  }

  if (last7Days && Array.isArray(last7Days) && last7Days.length > 0) {
    const lines = last7Days
      .slice(-7)
      .map((d, idx) => {
        const dayLabel = d.label || `Day ${idx + 1}`;
        return `- ${dayLabel}: ${d.kcal || 0} kcal, ${d.protein || 0} g protein`;
      })
      .join("\n");

    extra += `
Recent log (last days, approximate):
${lines}

Use this to comment on consistency, heavy / light days, and trends.
If they are clearly under-eating protein or always way over calories,
coach them gently and give a simple plan.
`;
  }

  return BASE_SYSTEM_PROMPT + extra;
}

// ---------- HEALTH CHECK (GET /api) ----------
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "NutriMind backend is online ✅",
  });
}

// ---------- MAIN COACH ROUTE (POST /api) ----------
export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is NOT set in .env.local!");
      return NextResponse.json(
        { ok: false, message: "Server misconfigured – missing API key." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);

    const userMessage = body?.message;
    const baseline = body?.baseline || null;
    const last7Days = body?.last7Days || body?.history || null;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { ok: false, message: "Missing 'message' (string) in request body." },
        { status: 400 }
      );
    }

    // --- SESSION HANDLING ---
    const { id: sessionId, isNew } = getSessionId(req);

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }

    const history = sessions.get(sessionId);

    // store user message in history
    history.push({ role: "user", content: userMessage });

    // limit history length to avoid massive prompts
    if (history.length > 40) {
      history.splice(0, history.length - 40);
    }

    // --- BUILD SYSTEM PROMPT USING BASELINE + LOGS ---
    const systemPrompt = buildSystemPrompt({ baseline, last7Days });

    const input = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    // --- CALL OPENAI ---
    const client = getOpenAIClient();
    const ai = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: input,
      max_tokens: 350,
    });

    let reply =
      ai.choices?.[0]?.message?.content?.trim() ||
      "I understood your question, but I couldn't format my answer correctly. Try asking again a bit differently.";

    // avoid repeating the exact same text back-to-back
    const lastAssistant = [...history].reverse().find(
      (m) => m.role === "assistant"
    );
    if (lastAssistant && lastAssistant.content === reply) {
      reply +=
        "\n\n(Adjusting the plan so I’m not just repeating myself. Want to attack this from another angle?)";
    }

    // add assistant message to history
    history.push({ role: "assistant", content: reply });

    const res = NextResponse.json({
      ok: true,
      reply,
    });

    // set cookie if new session
    if (isNew) {
      res.cookies.set("nutrimind_session", sessionId, {
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    return res;
  } catch (err) {
    console.error("NutriMind backend ERROR:", err);

    return NextResponse.json(
      {
        ok: false,
        message:
          "NutriMind server error. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
