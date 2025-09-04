// Safe localStorage wrapper with error handling
class StorageManager {
  private isAvailable(): boolean {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    if (!this.isAvailable()) return defaultValue || null;

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue || null;
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Failed to get item from storage: ${key}`, error);
      return defaultValue || null;
    }
  }

  set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set item in storage: ${key}`, error);
      return false;
    }
  }

  remove(key: string): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove item from storage: ${key}`, error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn("Failed to clear storage", error);
      return false;
    }
  }
}

export const storage = new StorageManager();

// Storage keys
export const STORAGE_KEYS = {
  USER: "linkly_user",
  PREFERENCES: "linkly_preferences",
  THEME: "linkly_theme",
  RECENT_LINKS: "linkly_recent_links",
} as const;

// User-specific storage helpers
export const userStorage = {
  getUser: () => storage.get(STORAGE_KEYS.USER),
  setUser: (user: any) => storage.set(STORAGE_KEYS.USER, user),
  removeUser: () => storage.remove(STORAGE_KEYS.USER),

  getPreferences: () => storage.get(STORAGE_KEYS.PREFERENCES, {}),
  setPreferences: (prefs: any) => storage.set(STORAGE_KEYS.PREFERENCES, prefs),

  getRecentLinks: () => storage.get(STORAGE_KEYS.RECENT_LINKS, []),
  setRecentLinks: (links: any[]) =>
    storage.set(STORAGE_KEYS.RECENT_LINKS, links),
};
