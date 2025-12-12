// src/app/coach/api/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getOpenAIClient() {
  const key = (process.env.OPENAI_API_KEY || "").trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey: key,
  });
}

export async function POST(req) {
  console.log("📥 Coach API: Request received");
  try {
    // Parse request body first
    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error("Coach API: Invalid JSON body", err);
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid request format. Please try again.",
        },
        { status: 400 }
      );
    }

    const { message, baseline, today, history } = body || {};

    // Validate message
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Ask me something about training, food, or recovery.",
        },
        { status: 400 }
      );
    }

    // Check API key and initialize client
    const key = (process.env.OPENAI_API_KEY || "").trim();
    if (!key) {
      console.error("❌ OPENAI_API_KEY missing in environment variables");
      return NextResponse.json(
        {
          ok: false,
          message: "Server configuration error. Missing API key.",
        },
        { status: 500 }
      );
    }

    const client = getOpenAIClient();

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
      model: "gpt-4o-mini",
      temperature: 0.65,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "My mind blanked for a second — ask again.";

    console.log("✅ Coach API: OpenAI call successful");
    return NextResponse.json(
      {
        ok: true,
        message: reply,
      },
      { status: 200 }
    );
  } catch (err) {
    // Log error with status and message (no secrets)
    const errorStatus = err?.status || err?.response?.status;
    const errorMessage = err?.message || String(err);
    console.error("🔥 Coach API ERROR:", {
      status: errorStatus,
      message: errorMessage,
    });
    
    // Handle OpenAI 401 (Invalid API key)
    if (errorStatus === 401 || errorMessage?.includes("Incorrect API key") || errorMessage?.includes("401")) {
      return NextResponse.json(
        {
          ok: false,
          message: "Server configuration error. Invalid API key in production.",
        },
        { status: 500 }
      );
    }
    
    // Handle specific OpenAI errors
    if (err instanceof Error) {
      if (err.message.includes("API key") || err.message.includes("OPENAI_API_KEY")) {
        return NextResponse.json(
          {
            ok: false,
            message: "Server configuration error. Invalid API key in production.",
          },
          { status: 500 }
        );
      }
      
      if (err.message.includes("timeout") || err.message.includes("network")) {
        return NextResponse.json(
          {
            ok: false,
            message: "Request timed out. Please try again.",
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      {
        ok: false,
        message: "NutriMind crashed for a moment. Try again — I'll be ready.",
      },
      { status: 500 }
    );
  }
}

// Optional health check for GET
export async function GET() {
  return NextResponse.json({ ok: true, message: "Coach API alive ✅" });
}
