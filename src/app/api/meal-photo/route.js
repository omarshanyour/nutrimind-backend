
// src/app/api/meal-photo/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge"; // keep edge, it's fine

// 🔐 Read your OpenAI *project* API key from environment, NOT from code
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// helper: Uint8Array → base64 for edge runtime (no Buffer)
function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in the edge runtime
  return btoa(binary);
}

export async function POST(req) {
  try {
    const client = getOpenAIClient();
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return NextResponse.json(
        { ok: false, message: "No photo received." },
        { status: 400 }
      );
    }

    // Optional: basic file type check
    if (typeof file.type === "string" && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, message: "Please upload an image file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = bytesToBase64(bytes);

    const systemPrompt = `
You estimate calories, protein, carbs, and fats from FOOD PHOTOS.

Return ONLY JSON:

{
  "kcal": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fats_g": <number>
}

Rules:
- Identify the meal visually (burger, fries, bowl, pizza, etc).
- Pay attention to portion size (small/medium/large).
- If it looks like a known fast food item (In-N-Out, McDonald's, Chick-fil-A, etc),
  use typical macros for that item.
- Use the midpoint of common calorie ranges (aim slightly HIGH rather than low).
- No explanations. No notes. No backticks. ONLY raw JSON.
`;

    const completion = await client.chat.completions.create({
      // 👇 gpt-4o-mini supports vision + is cheap/fast
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 150,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64}`,
              },
            },
            {
              type: "text",
              text: "Estimate this meal.",
            },
          ],
        },
      ],
    });

    let raw = completion.choices?.[0]?.message?.content?.trim() ?? "";

    // safety: strip ```json fences if the model ever adds them
    if (raw.startsWith("```")) {
      raw = raw.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Could not parse meal-photo JSON:", raw);
      return NextResponse.json(
        {
          ok: false,
          message: "Could not read macros from this photo. Try a clearer shot.",
        },
        { status: 200 }
      );
    }

    const kcal = Number(parsed.kcal) || 0;
    const protein_g = Number(parsed.protein_g) || 0;
    const carbs_g = Number(parsed.carbs_g) || 0;
    const fats_g = Number(parsed.fats_g) || 0;

    return NextResponse.json(
      {
        ok: true,
        kcal,
        protein_g,
        carbs_g,
        fats_g,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PHOTO ERROR:", err);
    return NextResponse.json(
      { ok: false, message: "Server error reading that meal photo." },
      { status: 500 }
    );
  }
}
