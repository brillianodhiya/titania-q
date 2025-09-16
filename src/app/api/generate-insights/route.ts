import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { AIProviderConfig } from "@/types/ai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
      console.log(
        "Generate insights API - Received body:",
        JSON.stringify(body, null, 2)
      );
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { queryResult, schema, aiConfig } = body;
    console.log("Generate insights API - queryResult:", queryResult);
    console.log("Generate insights API - schema:", schema);
    console.log("Generate insights API - aiConfig:", aiConfig);

    if ((!queryResult && !schema) || !aiConfig) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const insights = await generateInsights(queryResult || schema, aiConfig);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Insights generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

async function generateInsights(
  data: any,
  aiConfig: AIProviderConfig
): Promise<string> {
  let prompt: string;

  // Check if it's a QueryResult (has columns, rows, row_count)
  if (data.columns && data.rows && data.row_count !== undefined) {
    prompt = `Analisis hasil query berikut dan berikan wawasan dalam bahasa Indonesia:

Columns: ${data.columns.join(", ")}
Rows: ${data.row_count}
Data: ${JSON.stringify(data.rows.slice(0, 10), null, 2)}

Silakan berikan:
1. Temuan utama dari data
2. Pola atau tren yang diamati
3. Rekomendasi berdasarkan hasil
4. Potensi masalah atau anomali

Berikan respons yang ringkas dan dapat ditindaklanjuti dalam bahasa Indonesia.`;
  } else if (data.tables) {
    // It's a DatabaseSchema
    prompt = `Analisis skema database berikut dan berikan wawasan dalam bahasa Indonesia:

Database Schema:
${data.tables
  .map(
    (table: any) =>
      `Table: ${table.name}
Columns: ${table.columns
        .map(
          (col: any) =>
            `${col.name} (${col.data_type})${
              col.is_primary_key ? " [PK]" : ""
            }${col.is_foreign_key ? " [FK]" : ""}`
        )
        .join(", ")}`
  )
  .join("\n\n")}

Silakan berikan:
1. Analisis struktur database
2. Relasi antar tabel
3. Tipe data dan constraint
4. Peluang optimasi
5. Rekomendasi untuk desain database
6. Saran query untuk mengeksplorasi data

Berikan respons yang ringkas dan dapat ditindaklanjuti dalam bahasa Indonesia.`;
  } else {
    prompt = `Analisis data berikut dan berikan wawasan dalam bahasa Indonesia:

Data: ${JSON.stringify(data, null, 2)}

Silakan berikan:
1. Temuan utama dari data
2. Pola atau tren yang diamati
3. Rekomendasi berdasarkan hasil
4. Potensi masalah atau anomali

Berikan respons yang ringkas dan dapat ditindaklanjuti dalam bahasa Indonesia.`;
  }

  switch (aiConfig.provider) {
    case "openai":
      return await generateWithOpenAI(prompt, aiConfig);
    case "gemini":
      return await generateWithGemini(prompt, aiConfig);
    case "anthropic":
      return await generateWithAnthropic(prompt, aiConfig);
    case "ollama":
      return await generateWithOllama(prompt, aiConfig);
    default:
      throw new Error("Unsupported AI provider");
  }
}

async function generateWithOpenAI(
  prompt: string,
  config: AIProviderConfig
): Promise<string> {
  const { openai } = await import("@ai-sdk/openai");
  const originalApiKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = config.api_key;

  try {
    const { text } = await generateText({
      model: openai(config.model || "gpt-3.5-turbo"),
      prompt,
      maxOutputTokens: 2000,
    });
    return text;
  } finally {
    if (originalApiKey) {
      process.env.OPENAI_API_KEY = originalApiKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  }
}

async function generateWithGemini(
  prompt: string,
  config: AIProviderConfig
): Promise<string> {
  const { google } = await import("@ai-sdk/google");
  const originalApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.api_key;

  try {
    const { text } = await generateText({
      model: google(config.model || "gemini-1.5-flash"),
      prompt,
      maxOutputTokens: 2000,
    });
    return text;
  } finally {
    if (originalApiKey) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalApiKey;
    } else {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    }
  }
}

async function generateWithAnthropic(
  prompt: string,
  config: AIProviderConfig
): Promise<string> {
  const { anthropic } = await import("@ai-sdk/anthropic");
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = config.api_key;

  try {
    const { text } = await generateText({
      model: anthropic(config.model || "claude-3-haiku-20240307"),
      prompt,
      maxOutputTokens: 2000,
    });
    return text;
  } finally {
    if (originalApiKey) {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  }
}

async function generateWithOllama(
  prompt: string,
  config: AIProviderConfig
): Promise<string> {
  const response = await fetch(`${config.base_url}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}
