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
      console.error("JSON parse error:", parseError);
      return NextResponse.json({
        valid: false,
        error: "Invalid JSON in request body",
      });
    }

    const { aiConfig } = body;

    if (!aiConfig) {
      return NextResponse.json({
        valid: false,
        error: "No AI config provided",
      });
    }

    const isValid = await testApiKey(aiConfig);
    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("API key validation error:", error);
    return NextResponse.json({ valid: false, error: "Validation failed" });
  }
}

async function testApiKey(config: AIProviderConfig): Promise<boolean> {
  const prompt = "Hello";

  try {
    switch (config.provider) {
      case "openai":
        return await testOpenAI(config, prompt);
      case "gemini":
        return await testGemini(config, prompt);
      case "anthropic":
        return await testAnthropic(config, prompt);
      case "ollama":
        return await testOllama(config);
      default:
        return false;
    }
  } catch (error) {
    console.error("API key test failed:", error);
    return false;
  }
}

async function testOpenAI(
  config: AIProviderConfig,
  prompt: string
): Promise<boolean> {
  try {
    const { openai } = await import("@ai-sdk/openai");
    const originalApiKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = config.api_key;

    try {
      await generateText({
        model: openai(config.model || "gpt-3.5-turbo"),
        prompt,
        maxOutputTokens: 50,
      });
      return true;
    } finally {
      if (originalApiKey) {
        process.env.OPENAI_API_KEY = originalApiKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  } catch {
    return false;
  }
}

async function testGemini(
  config: AIProviderConfig,
  prompt: string
): Promise<boolean> {
  try {
    const { google } = await import("@ai-sdk/google");
    const originalApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.api_key;

    try {
      await generateText({
        model: google(config.model || "gemini-1.5-flash"),
        prompt,
        maxOutputTokens: 50,
      });
      return true;
    } finally {
      if (originalApiKey) {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalApiKey;
      } else {
        delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      }
    }
  } catch {
    return false;
  }
}

async function testAnthropic(
  config: AIProviderConfig,
  prompt: string
): Promise<boolean> {
  try {
    const { anthropic } = await import("@ai-sdk/anthropic");
    const originalApiKey = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = config.api_key;

    try {
      await generateText({
        model: anthropic(config.model || "claude-3-haiku-20240307"),
        prompt,
        maxOutputTokens: 50,
      });
      return true;
    } finally {
      if (originalApiKey) {
        process.env.ANTHROPIC_API_KEY = originalApiKey;
      } else {
        delete process.env.ANTHROPIC_API_KEY;
      }
    }
  } catch {
    return false;
  }
}

async function testOllama(config: AIProviderConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.base_url}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
