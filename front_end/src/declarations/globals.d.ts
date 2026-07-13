declare global {
  interface Window {
    rdt?: (
      command: string,
      event?: string,
      data?: Record<string, unknown>
    ) => void;
  }
}

export {};
