import { NextRequest, NextResponse } from "next/server";
import { AIProviderConfig } from "@/types/ai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { aiConfig } = await request.json();

    if (!aiConfig) {
      return NextResponse.json({ models: [] });
    }

    const models = await getAvailableModels(aiConfig);
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Get models error:", error);
    return NextResponse.json({ models: [] });
  }
}

async function getAvailableModels(config: AIProviderConfig): Promise<string[]> {
  switch (config.provider) {
    case "openai":
      return getOpenAIModels();
    case "gemini":
      return getGeminiModels();
    case "anthropic":
      return getAnthropicModels();
    case "ollama":
      return await getOllamaModels(config);
    default:
      return [];
  }
}

function getOpenAIModels(): string[] {
  return [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k",
  ];
}

function getGeminiModels(): string[] {
  return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"];
}

function getAnthropicModels(): string[] {
  return [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
  ];
}

async function getOllamaModels(config: AIProviderConfig): Promise<string[]> {
  try {
    const response = await fetch(`${config.base_url}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return [];
  }
}
