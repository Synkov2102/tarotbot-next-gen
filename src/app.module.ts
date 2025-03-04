import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BotModule } from './bot/bot.module';
import { DbModule } from './db/db.module';
import { TarotModule } from './tarot/tarot.module';

@Module({
  imports: [
    DbModule,
    TarotModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.registerAsync({
      useFactory: () => {
        // Отключаем проверку сертификатов - обходим сертификаты минцифры (Не безопасно по пока сойдет)
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        return {};
      },
    }),
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
