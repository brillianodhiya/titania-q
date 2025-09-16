import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { AIProviderConfig } from "@/types/ai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { question, schemaDescription, aiConfig } = body;

    if (!question || !schemaDescription || !aiConfig) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const response = await consultDatabase(
      question,
      schemaDescription,
      aiConfig
    );
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Database consultation error:", error);
    return NextResponse.json(
      { error: "Failed to consult database" },
      { status: 500 }
    );
  }
}

async function consultDatabase(
  question: string,
  schemaDescription: string,
  aiConfig: AIProviderConfig
): Promise<string> {
  const prompt = `Anda adalah seorang ahli database. Jawablah pertanyaan berikut tentang skema database dalam bahasa Indonesia dengan format markdown yang terstruktur:

Schema:
${schemaDescription}

Pertanyaan: ${question}

WAJIB gunakan format markdown berikut:

## 📋 Jawaban

[Berikan jawaban yang jelas dan langsung untuk pertanyaan tersebut]

## 🔍 Query SQL

\`\`\`sql
[Berikan query SQL yang relevan untuk menjawab pertanyaan]
\`\`\`

## 💡 Wawasan Database

[Berikan wawasan tambahan tentang struktur database yang relevan]

## ⚡ Praktik Terbaik

[Berikan rekomendasi atau praktik terbaik yang terkait dengan pertanyaan]

## 📊 Informasi Tambahan

[Informasi tambahan yang mungkin berguna]

---

**Catatan:** Pastikan semua kode SQL menggunakan syntax yang benar dan sesuai dengan skema database yang tersedia. Gunakan nama tabel dan kolom yang tepat sesuai dengan skema.`;

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
      maxOutputTokens: 1000,
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
      maxOutputTokens: 1000,
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
      maxOutputTokens: 1000,
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
