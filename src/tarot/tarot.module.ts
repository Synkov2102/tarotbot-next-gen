import { Module } from '@nestjs/common';
import { TarotService } from './tarot.service';

@Module({
  providers: [TarotService],
  exports: [TarotService],
})
export class TarotModule {}
