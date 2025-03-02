import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [TelegramBotService],
})
export class BotModule {}
