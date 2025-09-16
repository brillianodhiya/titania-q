import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { AIProviderConfig } from "@/types/ai";

export const dynamic = "force-dynamic";

// Function to clean Mermaid diagram from markdown code blocks
function cleanMermaidFromMarkdown(diagram: string): string {
  // Ensure diagram is a string primitive
  const diagramStr = String(diagram);

  // Remove markdown code blocks
  let cleaned = diagramStr
    .replace(/```mermaid\s*/gi, "")
    .replace(/```\s*$/g, "");

  // Remove any remaining markdown formatting
  cleaned = cleaned.replace(/```/g, "");

  // Remove classDef lines that cause low contrast - more aggressive regex
  cleaned = cleaned.replace(/classDef\s+default\s+fill:[^;]+;?\s*/gi, "");
  cleaned = cleaned.replace(/classDef\s+default\s+[^;]+;?\s*/gi, "");
  cleaned = cleaned.replace(/classDef\s+[^;]+;?\s*/gi, "");

  // Remove any remaining classDef patterns
  cleaned = cleaned.replace(/classDef[^;]*;?\s*/gi, "");

  // Trim whitespace
  cleaned = cleaned.trim();

  // If empty after cleaning, return original
  if (!cleaned) {
    return diagramStr.trim();
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

    const { schemaDescription, aiConfig } = body;

    console.log("Generate Diagram API - aiConfig:", aiConfig);
    console.log(
      "Generate Diagram API - schemaDescription length:",
      schemaDescription?.length
    );

    if (!schemaDescription || !aiConfig) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const diagram = await generateDiagram(schemaDescription, aiConfig);
    console.log("Generated Diagram (raw):", diagram);

    // Clean diagram from markdown code blocks
    const cleanDiagram = cleanMermaidFromMarkdown(diagram);
    console.log("Generated Diagram (raw):", diagram);
    console.log("Generated Diagram (cleaned):", cleanDiagram);

    // Check if classDef was removed
    if (cleanDiagram.includes("classDef")) {
      console.log("WARNING: classDef still present in cleaned diagram!");
    } else {
      console.log("SUCCESS: classDef removed from diagram");
    }

    return NextResponse.json({ diagram: cleanDiagram });
  } catch (error) {
    console.error("Diagram generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate diagram" },
      { status: 500 }
    );
  }
}

async function generateDiagram(
  schemaDescription: string,
  aiConfig: AIProviderConfig
): Promise<string> {
  const prompt = `Buat diagram ER Mermaid untuk skema database berikut dengan SEMUA KOLOM BERWARNA GELAP:

${schemaDescription}

PENTING: SEMUA KOLOM HARUS BERWARNA GELAP, TIDAK ADA WARNA SELINGAN!

PERSYARATAN WAJIB:
1. Gunakan sintaks diagram ER Mermaid yang benar
2. Sertakan SEMUA tabel yang ada dalam skema
3. Tampilkan primary key (PK) dan foreign key (FK) dengan jelas
4. Gunakan nama tabel dan kolom yang sesuai dengan skema
5. Sertakan indikator kardinalitas (1:1, 1:N, N:M) di relasi
6. Buat diagram yang mudah dibaca dan terstruktur dengan baik
7. Gunakan format: erDiagram
8. Tampilkan tipe data untuk setiap kolom
9. SEMUA KOLOM HARUS BERWARNA GELAP KONSISTEN

LARANGAN KETAT - WAJIB DIPATUHI:
- JANGAN gunakan classDef atau styling apapun
- JANGAN gunakan fill:#f9f atau warna terang lainnya
- JANGAN gunakan stroke:#333 atau warna abu-abu terang
- JANGAN gunakan stroke-width yang tipis
- JANGAN gunakan baris classDef default fill:#f9f,stroke:#333,stroke-width:2px;
- JANGAN gunakan styling apapun selain erDiagram murni
- JANGAN gunakan warna selingan untuk kolom

STYLING UNTUK KONSISTENSI:
- SEMUA kolom harus berwarna gelap yang sama
- TIDAK ADA warna selingan atau alternating colors
- Gunakan warna yang kontras tinggi dengan background putih
- Pastikan semua text terlihat jelas
- Gunakan stroke yang tebal untuk garis relationship

FORMAT OUTPUT:
- HANYA keluarkan kode diagram Mermaid murni
- TIDAK boleh ada penjelasan atau teks lain
- TIDAK boleh menggunakan markdown (backticks atau code blocks)
- Mulai dengan "erDiagram"
- Gunakan sintaks yang benar untuk relasi
- JANGAN gunakan mermaid atau di awal dan akhir
- JANGAN gunakan classDef atau styling apapun

Contoh format:
erDiagram
    TABLE1 {
        int id PK
        string name
    }
    TABLE2 {
        int id PK
        int table1_id FK
        string description
    }
    TABLE1 ||--o{ TABLE2 : "relasi"

Diagram Mermaid:`;

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
    console.log("Calling Gemini for diagram with model:", config.model);
    console.log("Prompt length:", prompt.length);

    const result = await generateText({
      model: google(config.model || "gemini-1.5-flash"),
      prompt,
      maxOutputTokens: 2000,
    });

    console.log("Gemini diagram response:", result);
    console.log("Generated diagram text:", result.text);

    if (!result.text || result.text.trim() === "") {
      throw new Error("Gemini returned empty diagram response");
    }

    return result.text;
  } catch (error) {
    console.error("Gemini diagram generation error:", error);
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
