// src/app/api/news/route.js
import { NextResponse } from "next/server";

// Broad health/fitness feed
const FEED_URL =
  "https://news.google.com/rss/search?q=health+fitness+nutrition+grocery+discount+gym+membership&hl=en-US&gl=US&ceid=US:en";

// Keywords that sound like deals / useful money stuff
const DEAL_KEYWORDS = [
  "discount",
  "deal",
  "save",
  "off",
  "%",
  "membership",
  "sale",
  "promo",
  "offer",
  "coupon",
  "price",
  "grocery",
  "supermarket",
  "subscription",
  "gym",
  "fitness",
];

function looksLikeDeal(title) {
  const lower = title.toLowerCase();
  return DEAL_KEYWORDS.some((k) => lower.includes(k));
}

export async function GET() {
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error("Failed to fetch news feed");

    const xml = await res.text();
    const items = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) && items.length < 10) {
      const block = match[1];

      const titleMatch =
        block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
        block.match(/<title>(.*?)<\/title>/);
      const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || "").trim();

      const linkMatch = block.match(/<link>(.*?)<\/link>/);
      const url = (linkMatch?.[1] || "").trim();

      const sourceMatch =
        block.match(/<source[^>]*><!\[CDATA\[(.*?)\]\]><\/source>/) ||
        block.match(/<source[^>]*>(.*?)<\/source>/);
      const source = (sourceMatch?.[1] || sourceMatch?.[2] || "Health news").trim();

      if (!url || !rawTitle) continue;

      const title = rawTitle
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');

      // Only keep items that look like useful deals / money / fitness-related
      if (!looksLikeDeal(title)) continue;

      items.push({ title, url, source });
    }

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json(
      { ok: false, items: [] },
      { status: 500 }
    );
  }
}
