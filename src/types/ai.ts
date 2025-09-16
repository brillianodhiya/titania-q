export interface AIProviderConfig {
  provider: "ollama" | "openai" | "gemini";
  api_key?: string;
  base_url?: string;
  model: string;
}
