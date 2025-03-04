import { Injectable } from '@nestjs/common';
import { AiMessage, AiProvider, AiProviderBrand } from './ai.interface';
import { AiProviderFactory } from './ai.factory';

@Injectable()
export class AiService {
  private readonly providers: Map<AiProviderBrand, AiProvider>;

  constructor(private readonly providerFactory: AiProviderFactory) {
    this.providers = new Map([
      [
        AiProviderBrand.DEEPSEEK,
        this.providerFactory.create(AiProviderBrand.DEEPSEEK),
      ],
      [
        AiProviderBrand.GIGACHAT,
        this.providerFactory.create(AiProviderBrand.GIGACHAT),
      ],
    ]);
  }

  async generateAiResponse(
    messages: AiMessage[],
    providerType: AiProviderBrand = AiProviderBrand.DEEPSEEK,
  ) {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not found`);
    }
    return provider.generateAiResponse(messages);
  }
}
