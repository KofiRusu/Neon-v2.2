// Base Agent class for all AI agents
export abstract class BaseAgent {
  protected name: string;
  protected apiKey?: string;
  protected config: Record<string, unknown>;

  constructor(name: string, apiKey?: string, config: Record<string, unknown> = {}) {
    this.name = name;
    this.apiKey = apiKey;
    this.config = config;
  }

  abstract execute(input: Record<string, unknown>): Promise<Record<string, unknown>>;

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${this.name}] ${message}`);
  }

  protected validateInput(input: Record<string, unknown>, required: string[]): void {
    for (const field of required) {
      if (!(field in input)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  getName(): string {
    return this.name;
  }

  getConfig(): Record<string, unknown> {
    return { ...this.config };
  }

  updateConfig(newConfig: Record<string, unknown>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default BaseAgent;
