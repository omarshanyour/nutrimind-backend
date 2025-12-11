// src/app/coach/api/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    // Confirm OpenAI key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY missing in .env.local");
      return NextResponse.json(
        {
          ok: false,
          message: "Server missing API key. Add it to .env.local.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const { message, baseline, today, history } = body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Ask me something about training, food, or recovery.",
        },
        { status: 400 }
      );
    }

    const context = {
      baseline: baseline || {},
      today: today || {},
      last7Days: Array.isArray(history) ? history : [],
    };

    const systemPrompt = `
You are NutriMind — a clean, simple, VERY smart performance coach.

RULES:
- Keep answers short, readable, and friendly.
- 2–4 paragraphs max or clean bullet points.
- Give real examples: food amounts, timing, simple student meals.
- Use the baseline + last 7 days quietly (DO NOT repeat them).
- No emojis. No giant paragraphs.
- If anything sounds medical, tell them to talk to a professional.

Use the JSON below privately to guide your answer:

${JSON.stringify(context, null, 2)}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.65,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "My mind blanked for a second — ask again.";

    return NextResponse.json(
      {
        ok: true,
        message: reply,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 Coach API ERROR:", err);
    return NextResponse.json(
      {
        ok: false,
        message:
          "NutriMind crashed for a moment. Try again — I’ll be ready.",
      },
      { status: 500 }
    );
  }
}

// Optional health check for GET
export async function GET() {
  return NextResponse.json({ ok: true, message: "Coach API alive ✅" });
}
