// src/app/api/deals/route.js

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Your working NewsAPI key
    const apiKey = "7fc1505b41714bc8994f40faa8e41e97";

    const url = `https://newsapi.org/v2/top-headlines?category=health&language=en&pageSize=5&apiKey=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error("NewsAPI error:", await res.text());
      return NextResponse.json({ deals: [] }, { status: 200 });
    }

    const data = await res.json();

    return NextResponse.json({ deals: data.articles || [] });
  } catch (err) {
    console.error("Deals route error:", err);
    return NextResponse.json({ deals: [], error: "Server error" }, { status: 200 });
  }
}
