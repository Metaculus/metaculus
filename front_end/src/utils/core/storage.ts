export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage.getItem error:", error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn("localStorage.setItem error:", error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("localStorage.removeItem error:", error);
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn("localStorage.clear error:", error);
    }
  },

  keys: (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      return Object.keys(window.localStorage);
    } catch (error) {
      console.warn("localStorage keys error:", error);
      return [];
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      console.warn("sessionStorage.getItem error:", error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn("sessionStorage.setItem error:", error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn("sessionStorage.removeItem error:", error);
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.warn("sessionStorage.clear error:", error);
    }
  },
};
