export interface AiProvider {
  generateAiResponse(messages: AiMessage[]): Promise<string>;
}

export interface AiMessage {
  role: string;
  content: string | Array<unknown>;
  name?: string;
}

export enum AiProviderBrand {
  DEEPSEEK,
  GIGACHAT,
}
