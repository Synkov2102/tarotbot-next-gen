import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { TarotModule } from './tarot/tarot.module';

@Module({
  imports: [DbModule, TarotModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
