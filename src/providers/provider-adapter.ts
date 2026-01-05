/**
 * Provider Adapter
 * Unified interface for multiple AI providers
 */

interface ProviderResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

interface ProviderOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class ProviderAdapter {
  private provider: string;
  private apiKey: string;
  private model: string;

  private static readonly PROVIDER_CONFIG: Record<string, { envVar: string; model: string; baseUrl: string }> = {
    claude: {
      envVar: 'ANTHROPIC_API_KEY',
      model: 'claude-opus-4-5-20251101',
      baseUrl: 'https://api.anthropic.com/v1'
    },
    openai: {
      envVar: 'OPENAI_API_KEY',
      model: 'gpt-4-turbo-preview',
      baseUrl: 'https://api.openai.com/v1'
    },
    gemini: {
      envVar: 'GOOGLE_API_KEY',
      model: 'gemini-pro',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
    },
    grok: {
      envVar: 'XAI_API_KEY',
      model: 'grok-1',
      baseUrl: 'https://api.x.ai/v1'
    }
  };

  constructor(provider: string) {
    const config = ProviderAdapter.PROVIDER_CONFIG[provider];
    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    this.provider = provider;
    this.model = config.model;

    const apiKey = process.env[config.envVar];
    if (!apiKey) {
      throw new Error(`API key not found: ${config.envVar}`);
    }
    this.apiKey = apiKey;
  }

  /**
   * Execute a prompt and return the response
   */
  async execute(prompt: string, options: ProviderOptions = {}): Promise<string> {
    switch (this.provider) {
      case 'claude':
        return this.executeAnthropic(prompt, options);
      case 'openai':
        return this.executeOpenAI(prompt, options);
      case 'gemini':
        return this.executeGemini(prompt, options);
      case 'grok':
        return this.executeGrok(prompt, options);
      default:
        throw new Error(`Provider not implemented: ${this.provider}`);
    }
  }

  private async executeAnthropic(prompt: string, options: ProviderOptions): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        messages: [
          { role: 'user', content: prompt }
        ],
        ...(options.systemPrompt && { system: options.systemPrompt })
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async executeOpenAI(prompt: string, options: ProviderOptions): Promise<string> {
    const messages: any[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async executeGemini(prompt: string, options: ProviderOptions): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async executeGrok(prompt: string, options: ProviderOptions): Promise<string> {
    // Grok uses OpenAI-compatible API
    const messages: any[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Get provider info
   */
  getInfo(): { provider: string; model: string } {
    return { provider: this.provider, model: this.model };
  }

  /**
   * Check if a provider is available (has API key set)
   */
  static isAvailable(provider: string): boolean {
    const config = ProviderAdapter.PROVIDER_CONFIG[provider];
    if (!config) return false;
    return !!process.env[config.envVar];
  }

  /**
   * List all available providers
   */
  static listAvailable(): string[] {
    return Object.keys(ProviderAdapter.PROVIDER_CONFIG)
      .filter(p => ProviderAdapter.isAvailable(p));
  }
}
