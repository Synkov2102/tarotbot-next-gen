import { Module } from '@nestjs/common';
import { TarotService } from './tarot.service';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [DbModule],
  providers: [TarotService],
  exports: [TarotService],
})
export class TarotModule {}
