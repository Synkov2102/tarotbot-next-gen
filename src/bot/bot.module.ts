import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { AiModule } from 'src/ai/ai.module';
import { TarotModule } from 'src/tarot/tarot.module';

@Module({
  imports: [AiModule, TarotModule],
  providers: [TelegramBotService],
})
export class BotModule {}
