import { invoke } from "@tauri-apps/api/tauri";
import { AIProviderConfig } from "@/types/ai";

export class AIService {
  static async consultDatabase(
    question: string,
    schemaDescription: string,
    aiConfig: AIProviderConfig
  ) {
    return await invoke<string>("consult_database", {
      request: {
        question,
        schema_description: schemaDescription,
        ai_config: aiConfig,
      },
    });
  }

  static async generateSQL(
    naturalLanguageQuery: string,
    schemaDescription: string,
    aiConfig: AIProviderConfig
  ) {
    return await invoke<string>("generate_sql", {
      request: {
        natural_language_query: naturalLanguageQuery,
        schema_description: schemaDescription,
        ai_config: aiConfig,
      },
    });
  }

  static async generateDiagram(
    schemaDescription: string,
    aiConfig: AIProviderConfig
  ) {
    return await invoke<string>("generate_diagram", {
      request: {
        schema_description: schemaDescription,
        ai_config: aiConfig,
      },
    });
  }

  static async generateInsights(
    queryResult: any,
    schema: any,
    aiConfig: AIProviderConfig
  ) {
    return await invoke<string>("generate_insights", {
      request: {
        query_result: queryResult,
        schema: schema,
        ai_config: aiConfig,
      },
    });
  }

  static async validateAIKey(aiConfig: AIProviderConfig) {
    return await invoke<boolean>("validate_ai_key", {
      config: aiConfig,
    });
  }

  static async getAvailableModels(aiConfig: AIProviderConfig) {
    return await invoke<string[]>("get_available_models", {
      config: aiConfig,
    });
  }
}
