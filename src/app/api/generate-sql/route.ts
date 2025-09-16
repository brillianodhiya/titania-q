import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { AIProviderConfig } from "@/types/ai";

export const dynamic = "force-dynamic";

function cleanSQLFromMarkdown(sql: string): string {
  // Remove markdown code blocks
  let cleaned = sql.replace(/```sql\s*/gi, "").replace(/```\s*$/g, "");

  // Remove any remaining markdown formatting
  cleaned = cleaned.replace(/```/g, "");

  // Trim whitespace
  cleaned = cleaned.trim();

  // If empty after cleaning, return original
  if (!cleaned) {
    return sql.trim();
  }

  return cleaned;
}

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

    const { naturalLanguageQuery, schemaDescription, aiConfig } = body;

    console.log(
      "Generate SQL API - naturalLanguageQuery:",
      naturalLanguageQuery
    );
    console.log("Generate SQL API - aiConfig:", aiConfig);

    if (!naturalLanguageQuery || !schemaDescription || !aiConfig) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const sqlQuery = await generateSQL(
      naturalLanguageQuery,
      schemaDescription,
      aiConfig
    );

    // Clean SQL from markdown code blocks
    const cleanSQL = cleanSQLFromMarkdown(sqlQuery);
    console.log("Generated SQL:", cleanSQL);
    return NextResponse.json({ sql: cleanSQL });
  } catch (error) {
    console.error("SQL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate SQL query" },
      { status: 500 }
    );
  }
}

async function generateSQL(
  naturalLanguageQuery: string,
  schemaDescription: string,
  aiConfig: AIProviderConfig
): Promise<string> {
  const prompt = createPrompt(naturalLanguageQuery, schemaDescription);

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

function createPrompt(
  naturalLanguageQuery: string,
  schemaDescription: string
): string {
  return `Anda adalah ahli SQL. Berdasarkan skema database dan query bahasa alami, buatlah query SQL yang valid.

${schemaDescription}

Query Bahasa Alami: "${naturalLanguageQuery}"

ATURAN VALIDASI KRITIS:
1. SEBELUM menulis query, periksa dengan teliti skema di atas
2. HANYA gunakan nama tabel yang tercantum dalam skema
3. HANYA gunakan nama kolom yang tercantum di bawah setiap tabel dalam skema
4. Jika tabel atau kolom tidak ada dalam skema, JANGAN gunakan
5. Saat menggunakan alias tabel (t1, t2, dll), pastikan merujuk ke tabel yang benar
6. Periksa bahwa kondisi JOIN menggunakan kolom yang ada dari kedua tabel
7. Verifikasi bahwa semua kolom SELECT ada dalam tabel yang ditentukan

DAFTAR PERIKSA VALIDASI:
- [ ] Semua nama tabel ada dalam skema
- [ ] Semua nama kolom ada dalam tabel masing-masing
- [ ] Semua kondisi JOIN menggunakan kolom yang ada
- [ ] Semua kondisi WHERE menggunakan kolom yang ada
- [ ] Semua kolom ORDER BY ada dalam tabel

PENCEGAHAN ERROR:
- Jika Anda melihat "riwayat_pelanggan" dalam query tetapi tidak ada dalam skema, JANGAN gunakan
- Jika Anda melihat "nama_tamu" tetapi tidak tercantum di bawah tabel mana pun, JANGAN gunakan
- Jika Anda tidak yakin tentang kolom, periksa skema dengan teliti

FORMAT OUTPUT:
- HANYA kembalikan query SQL murni
- TIDAK boleh menggunakan markdown (backticks atau code blocks)
- TIDAK boleh ada penjelasan atau teks lain
- Gunakan sintaks MySQL yang benar
- Contoh: SELECT * FROM tabel;

Query SQL:`;
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
    console.log("Calling Gemini with model:", config.model);
    console.log("Prompt length:", prompt.length);

    const result = await generateText({
      model: google(config.model || "gemini-1.5-flash"),
      prompt,
      maxOutputTokens: 1000,
    });

    console.log("Gemini response:", result);
    console.log("Generated text:", result.text);

    if (!result.text || result.text.trim() === "") {
      throw new Error("Gemini returned empty response");
    }

    return result.text;
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
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
