import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiMessage, AiProvider } from '../ai.interface';

@Injectable()
export class DeepseekService implements AiProvider {
  private readonly deepseek: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.deepseek = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: this.configService.get('DEEPSEEK_API_KEY'),
    });
  }

  async generateAiResponse(messages: AiMessage[]): Promise<string> {
    const completion = await this.deepseek.chat.completions.create({
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      model: 'deepseek-chat',
    });
    Logger.log(completion.choices[0].message.content);
    return completion.choices[0].message.content ?? '';
  }
}
