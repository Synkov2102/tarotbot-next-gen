import { Injectable } from '@nestjs/common';
import { AiProvider, AiProviderBrand } from './ai.interface';
import { DeepseekService } from './deepseek/deepseek.service';
import { GigaChatService } from './gigachat/gigachat.service';

@Injectable()
export class AiProviderFactory {
  constructor(
    private readonly deepseekService: DeepseekService,
    private readonly gigachatService: GigaChatService,
  ) {}

  create(type: AiProviderBrand): AiProvider {
    switch (type) {
      case AiProviderBrand.DEEPSEEK:
        return this.deepseekService;
      case AiProviderBrand.GIGACHAT:
        return this.gigachatService;
      default:
        throw new Error(`Не найден такой провайдер: ${type}`);
    }
  }
}
