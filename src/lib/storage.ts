// Utility functions for localStorage operations

export const STORAGE_KEYS = {
  DATABASE_CONFIG: "titania_db_config",
  AI_CONFIG: "titania_ai_config",
} as const;

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return null;
  }
}

export function clearStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
}

export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear all localStorage:", error);
  }
}
