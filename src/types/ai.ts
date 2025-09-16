export interface AIProviderConfig {
  provider: "ollama" | "openai" | "gemini" | "anthropic";
  api_key?: string;
  base_url?: string;
  model: string;
}
