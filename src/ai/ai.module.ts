import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { DeepseekService } from './deepseek/deepseek.service';
import { GigaChatService } from './gigachat/gigachat.service';
import { AiProviderFactory } from './ai.factory';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [AiService, AiProviderFactory, DeepseekService, GigaChatService],
  exports: [AiService],
})
export class AiModule {}
