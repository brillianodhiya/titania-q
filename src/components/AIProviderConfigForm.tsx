"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AIProviderConfig } from "@/types/ai";
import { Brain, CheckCircle, RefreshCw } from "lucide-react";
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from "@/lib/storage";

interface AIProviderConfigFormProps {
  onConfig: (config: AIProviderConfig) => void;
}

export function AIProviderConfigForm({ onConfig }: AIProviderConfigFormProps) {
  const [config, setConfig] = useState<AIProviderConfig>({
    provider: "ollama",
    api_key: "",
    base_url: "http://localhost:11434",
    model: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false);
  const [apiKeyValidationError, setApiKeyValidationError] = useState<
    string | null
  >(null);
  const [justSaved, setJustSaved] = useState(false);

  // Load saved config from localStorage and Tauri on component mount
  useEffect(() => {
    loadSavedConfig();
  }, []);

  // Load models when provider changes (for cloud providers)
  useEffect(() => {
    if (config.provider !== "ollama" && config.api_key) {
      loadAvailableModels(config);
    }
  }, [config.provider, config.api_key]);

  const loadSavedConfig = async () => {
    // Don't reload if we just saved to prevent overriding the current state
    if (justSaved) {
      setJustSaved(false);
      return;
    }

    try {
      // First try to load from Tauri (most recent)
      const { invoke } = await import("@tauri-apps/api/tauri");
      const savedConfig = await invoke<AIProviderConfig | null>(
        "get_ai_config"
      );
      if (savedConfig && isValidConfig(savedConfig)) {
        console.log("Loading saved config from Tauri:", savedConfig);
        setConfig(savedConfig);
        // Load available models for the provider
        await loadAvailableModels(savedConfig);
        // Only mark as configured if model is also present
        if (savedConfig.model) {
          setIsConfigured(true);
          onConfig(savedConfig);
        }
        return;
      }
    } catch (err) {
      console.error("Failed to load AI config from Tauri:", err);
    }

    // Fallback to localStorage
    try {
      const savedConfig = loadFromStorage<AIProviderConfig>(
        STORAGE_KEYS.AI_CONFIG
      );
      if (savedConfig && isValidConfig(savedConfig)) {
        console.log("Loading saved config from localStorage:", savedConfig);
        setConfig(savedConfig);
        // Load available models for the provider
        await loadAvailableModels(savedConfig);
        // Only mark as configured if model is also present
        if (savedConfig.model) {
          setIsConfigured(true);
          onConfig(savedConfig);
        }
      }
    } catch (err) {
      console.error("Failed to load AI config from localStorage:", err);
    }
  };

  const isValidConfig = (config: AIProviderConfig): boolean => {
    // Check if config has required fields
    if (!config.provider) {
      return false;
    }

    // For non-Ollama providers, API key is required
    if (config.provider !== "ollama" && !config.api_key) {
      return false;
    }

    // For Ollama, base_url is required
    if (config.provider === "ollama" && !config.base_url) {
      return false;
    }

    return true;
  };

  const isValidConfigForSave = (config: AIProviderConfig): boolean => {
    // For saving, model is required
    return isValidConfig(config) && !!config.model;
  };

  const validateApiKey = async (config: AIProviderConfig): Promise<boolean> => {
    if (config.provider === "ollama") {
      // For Ollama, just check if server is reachable
      try {
        const response = await fetch(`${config.base_url}/api/tags`);
        return response.ok;
      } catch (error) {
        return false;
      }
    }

    // For other providers, use Tauri command
    try {
      const { AIService } = await import("@/lib/ai-service");
      return await AIService.validateAIKey(config);
    } catch (error) {
      console.error("API key validation error:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setApiKeyValidationError(null);

    console.log("AI Config Form Submit:", {
      provider: config.provider,
      hasApiKey: !!config.api_key,
      hasModel: !!config.model,
      baseUrl: config.base_url,
    });

    try {
      // First validate basic config (without model)
      const isBasicValid = isValidConfig(config);

      if (!isBasicValid) {
        setApiKeyValidationError("Please fill in all required fields");
        return;
      }

      // If model is already selected, proceed with full validation
      if (config.model) {
        // Validate API key
        setIsValidatingApiKey(true);
        console.log("Validating API key for provider:", config.provider);
        const isValid = await validateApiKey(config);
        console.log("API key validation result:", isValid);

        if (!isValid) {
          setApiKeyValidationError("Invalid API key or connection failed");
          return;
        }

        const { invoke } = await import("@tauri-apps/api/tauri");
        await invoke("set_ai_config", { config });

        // Save config to localStorage
        saveToStorage(STORAGE_KEYS.AI_CONFIG, config);

        console.log("AI config saved successfully");
        setIsConfigured(true);
        setJustSaved(true);
        onConfig(config);
      } else {
        // No model selected, load models directly (no API key validation needed)
        console.log("Loading available models for provider:", config.provider);
        await loadAvailableModels(config);
      }
    } catch (err) {
      console.error("Failed to save AI config:", err);
      setApiKeyValidationError("Failed to save configuration");
    } finally {
      setIsSaving(false);
      setIsValidatingApiKey(false);
    }
  };

  const handleInputChange = (field: keyof AIProviderConfig, value: string) => {
    // Allow model changes (including empty) for user selection

    // Only reset configured status if it's a critical field change
    if (field === "provider" || field === "api_key" || field === "base_url") {
      setIsConfigured(false);
    }

    setConfig((prev) => {
      const newConfig = {
        ...prev,
        [field]: value,
      };

      // If model is selected and other required fields are present, mark as configured
      if (field === "model" && value && isValidConfigForSave(newConfig)) {
        setIsConfigured(true);
        onConfig(newConfig);
      } else if (field === "model" && !value) {
        // If model is cleared, mark as not configured
        setIsConfigured(false);
      }

      return newConfig;
    });
  };

  const getDefaultModel = (provider: string) => {
    // Return empty string to let user select from dropdown
    return "";
  };

  const handleProviderChange = (provider: string) => {
    // Reset configured status when provider changes
    setIsConfigured(false);

    const newConfig = {
      ...config,
      provider: provider as AIProviderConfig["provider"],
      model: "", // Always start with empty model
      base_url: provider === "ollama" ? "http://localhost:11434" : undefined,
      // Keep existing API key when switching providers
      api_key: config.api_key,
    };

    setConfig(newConfig);

    if (provider === "ollama") {
      loadOllamaModels(newConfig);
    } else {
      // Load hardcoded models for cloud providers
      const models = getHardcodedModels(provider);
      setAvailableModels(models);
    }
  };

  const loadAvailableModels = async (config: AIProviderConfig) => {
    if (config.provider === "ollama") {
      await loadOllamaModels(config);
    } else {
      await loadCloudProviderModels(config);
    }
  };

  const loadOllamaModels = async (config: AIProviderConfig) => {
    if (config.provider !== "ollama") return;

    console.log("Loading Ollama models from:", config.base_url);
    setIsLoadingModels(true);
    try {
      const response = await fetch(`${config.base_url}/api/tags`);
      console.log("Ollama API response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Ollama API response data:", data);
        const models = data.models?.map((model: any) => model.name) || [];
        console.log("Extracted models:", models);
        setAvailableModels(models);
      } else {
        console.error(
          "Ollama API error:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Failed to load Ollama models:", error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const loadCloudProviderModels = async (config: AIProviderConfig) => {
    if (config.provider === "ollama") return;

    setIsLoadingModels(true);

    try {
      // Try to get models from Tauri command first
      const { AIService } = await import("@/lib/ai-service");
      const models = await AIService.getAvailableModels(config);
      if (models && models.length > 0) {
        setAvailableModels(models);
      } else {
        // Fallback to hardcoded models
        const hardcodedModels = getHardcodedModels(config.provider);
        setAvailableModels(hardcodedModels);
      }
    } catch (error) {
      console.error("Failed to load models from Tauri:", error);
      // Fallback to hardcoded models
      const models = getHardcodedModels(config.provider);
      setAvailableModels(models);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const getHardcodedModels = (provider: string): string[] => {
    switch (provider) {
      case "openai":
        return [
          "gpt-4o",
          "gpt-4o-mini",
          "gpt-4-turbo",
          "gpt-4",
          "gpt-3.5-turbo",
          "gpt-3.5-turbo-16k",
        ];
      case "gemini":
        return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"];
      case "anthropic":
        return [
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307",
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5" />
        <h3 className="text-lg font-semibold">AI Provider Configuration</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Configure your AI provider for natural language to SQL translation
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">AI Provider</label>
          <Select
            value={config.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <option value="ollama">Ollama (Local)</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
          </Select>
        </div>

        {config.provider === "ollama" && (
          <div>
            <label className="text-sm font-medium">Ollama Server URL</label>
            <Input
              value={config.base_url || ""}
              onChange={(e) => handleInputChange("base_url", e.target.value)}
              placeholder="http://localhost:11434"
            />
          </div>
        )}

        {(config.provider === "openai" || config.provider === "gemini") && (
          <div>
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              value={config.api_key || ""}
              onChange={(e) => {
                handleInputChange("api_key", e.target.value);
              }}
              placeholder="Enter your API key"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Model</label>
            {config.provider === "ollama" && (
              <Button
                type="button"
                onClick={() => loadOllamaModels(config)}
                disabled={isLoadingModels}
                size="sm"
                variant="outline"
              >
                {isLoadingModels ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh
              </Button>
            )}
          </div>
          <Select
            value={config.model}
            onChange={(e) => handleInputChange("model", e.target.value)}
          >
            <option value="">Select a model</option>
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </Select>
        </div>

        {/* API Key Validation Error */}
        {apiKeyValidationError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-4 h-4 mt-0.5">
                <svg
                  className="w-4 h-4 text-destructive"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">
                  Validation Error
                </p>
                <p className="text-sm text-destructive/80">
                  {apiKeyValidationError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Available Models Display */}
        {isLoadingModels && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <p className="text-sm text-blue-800">
                Loading available models...
              </p>
            </div>
          </div>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
            <p>Debug: availableModels.length = {availableModels.length}</p>
            <p>Debug: isLoadingModels = {isLoadingModels.toString()}</p>
            <p>Debug: provider = {config.provider}</p>
            <p>Debug: model = "{config.model}"</p>
            <p>Debug: isConfigured = {isConfigured.toString()}</p>
          </div>
        )}

        {availableModels.length > 0 && !isLoadingModels && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                Available Models ({availableModels.length})
              </p>
            </div>
            <div className="text-xs text-green-700">
              {availableModels.slice(0, 5).join(", ")}
              {availableModels.length > 5 &&
                ` and ${availableModels.length - 5} more...`}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSaving || isValidatingApiKey}
          className="w-full"
        >
          {isValidatingApiKey ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Validating API Key...
            </>
          ) : isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>

        {isConfigured && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">
              AI provider configured - {config.provider} ({config.model})
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
