import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { AiProviderBrand } from 'src/ai/ai.interface';
import { AiService } from 'src/ai/ai.service';
import { TarotService } from 'src/tarot/tarot.service';

@Injectable()
export class TelegramBotService {
  private token = process.env.TELEGRAM_BOT_TOKEN;
  private bot: TelegramBot;

  constructor(
    private aiService: AiService,
    private readonly tarotService: TarotService,
  ) {
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set');
    }
    this.bot = new TelegramBot(this.token, { polling: true });
    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    this.bot.on('message', this.handleMessage.bind(this));
  }

  private async handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    console.log(callbackQuery);
  }

  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text ?? '';

    if (text === '/start') {
      await this.bot.sendMessage(
        chatId,
        `🔮 Приветствую! Я ваш цифровой таролог.\n\n` +
          `Задайте мне любой вопрос, и я проведу расклад из трёх карт Таро, ` +
          `чтобы помочь вам найти ответ. Например:\n\n` +
          `• "Что меня ждёт в ближайший месяц?"\n` +
          `• "Как мне лучше поступить в этой ситуации?"\n` +
          `• "Что важно знать о наших отношениях?"\n\n` +
          `Просто напишите свой вопрос в чат, и я начну гадание!`,
      );
      return;
    }

    if (text.trim() === '') {
      await this.bot.sendMessage(
        chatId,
        `Пожалуйста, сформулируйте ваш вопрос текстом. ` +
          `Например: "Что мне ожидать на этой неделе?"`,
      );
      return;
    }

    try {
      await this.bot.sendMessage(
        chatId,
        `🔮 Приступаю к раскладу по вашему вопросу: "${text}"\n\nВыбираю три карты из колоды...`,
      );

      const cards = await this.tarotService.getThreeRandomCards();

      let aiResponseResolved = false;
      const aiResponsePromise = this.aiService
        .generateAiResponse(
          [
            {
              role: 'system',
              content:
                `Ты профессиональный таролог.\n` +
                'По контексту вопроса необходимо выбрать схему расклада и в соответствии с ней трактовать карты.\n' +
                `Сделай подробный расклад на основе трёх карт:\n` +
                cards
                  .map((card) => {
                    const isReversed = card.position === 'reversed';
                    return [
                      `Название: ${card.name}`,
                      `Положение: ${isReversed ? 'Перевёрнутое' : 'Прямое'}`,
                      `Интерпретация: ${
                        isReversed
                          ? card.base_interpretation_reversed
                          : card.base_interpretation_upright
                      }`,
                      `Ключевые слова: ${isReversed ? card.keywords_reversed : card.keywords_upright}`,
                      card.symbolism && `Символика: ${card.symbolism}`,
                      card.astrological_association &&
                        `Астрология: ${card.astrological_association}`,
                    ]
                      .filter(Boolean)
                      .join('\n');
                  })
                  .join('\n\n-----------------\n\n') +
                `\n\nУчти контекст вопроса: "${text}".`,
            },
            { role: 'user', content: text },
          ],
          AiProviderBrand.DEEPSEEK,
        )
        .then((response) => {
          aiResponseResolved = true;
          return response;
        });

      // Отправляем карты с интервалом 1 секунда
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];

        setTimeout(async () => {
          if (!aiResponseResolved) {
            await this.bot.sendMessage(
              chatId,
              `🃏 ${card.name} (${card.position === 'reversed' ? 'Перевёрнутая' : 'Прямая'})`,
            );
            if (card.image_url) {
              await this.bot.sendPhoto(chatId, card.image_url);
            }
          }

          // После последней карты отправляем сообщение о времени ожидания
          if (i === cards.length - 1 && !aiResponseResolved) {
            setTimeout(async () => {
              if (!aiResponseResolved) {
                await this.bot.sendMessage(
                  chatId,
                  `⏳ Анализ карт занимает 1-2 минуты. Благодарю за терпение!`,
                );
              }
            }, 1000); // Отправляется через 1 секунду после последней карты
          }
        }, i * 1000);
      }

      // Сообщения о процессе гадания (каждые 15 секунд)
      const waitingMessages = [
        '🔮 Я анализирую карты и их взаимосвязь...',
        '🃏 Карты раскрывают свои тайны...',
        '✨ Вселенная шепчет ответы...',
        '🔥 Судьба уже готова дать подсказку...',
      ];

      let index = 0;
      const messageInterval = setInterval(async () => {
        if (aiResponseResolved) {
          clearInterval(messageInterval);
          return;
        }
        await this.bot.sendMessage(
          chatId,
          waitingMessages[index % waitingMessages.length],
        );
        index++;
      }, 15000); // Каждые 15 секунд отправляем одно из сообщений

      // Ожидаем ответа от ИИ
      const aiResponse = await aiResponsePromise;

      // Останавливаем вывод сообщений ожидания, если они ещё идут
      clearInterval(messageInterval);

      // Отправляем предсказание
      await this.bot.sendMessage(
        chatId,
        `🔮 Ваше предсказание:\n\n${aiResponse.replace('*', '').replace('#', '')}\n\n` +
          `Если у вас есть новые вопросы - просто задайте их в чат!`,
      );
    } catch (error) {
      Logger.error('Ошибка при обработке запроса:', error.stack);
      await this.bot.sendMessage(
        chatId,
        'Произошла ошибка при гадании. Пожалуйста, попробуйте задать вопрос ещё раз.',
      );
    }
  }
}
