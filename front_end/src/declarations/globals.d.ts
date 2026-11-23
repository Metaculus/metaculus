declare global {
  interface Window {
    dataLayer?: unknown[];
    rdt?: (
      command: string,
      event?: string,
      data?: Record<string, unknown>
    ) => void;
  }
}

export {};
