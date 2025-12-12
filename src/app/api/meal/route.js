// src/app/api/meal/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

// 🔐 Your real project API key goes here:
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const description = body?.description;

    if (!description || description.trim().length < 2) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please describe your meal like 'Chipotle bowl, chicken, rice, cheese'.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You estimate calories, protein, carbs, and fats from meal descriptions.

Return ONLY JSON:

{
  "kcal": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fats_g": <number>
}

Rules:
- Use realistic nutrition values.
- For restaurants (In-N-Out, Chipotle, McDonalds) estimate typical items.
- If multiple foods are listed, add them.
- Aim slightly higher on calories.
- NO explanations. ONLY raw JSON.
`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: description },
      ],
    });

    let raw = completion.choices?.[0]?.message?.content?.trim() || "";

    if (raw.startsWith("```")) {
      raw = raw.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, message: "Could not estimate macros for this meal." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        kcal: Number(parsed.kcal) || 0,
        protein_g: Number(parsed.protein_g) || 0,
        carbs_g: Number(parsed.carbs_g) || 0,
        fats_g: Number(parsed.fats_g) || 0,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("MEAL ERROR:", err);
    return NextResponse.json(
      { ok: false, message: "Server error." },
      { status: 500 }
    );
  }
}
