import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { AiService } from 'src/ai/ai.service';
import { TarotService } from 'src/tarot/tarot.service';

@Injectable()
export class TelegramBotService {
  private token = process.env.TELEGRAM_BOT_TOKEN; // Используем переменную окружения
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

  /**
   * Инициализирует обработчики событий бота.
   */
  private initializeHandlers() {
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    this.bot.on('message', this.handleMessage.bind(this));
  }

  /**
   * Обрабатывает callback-запросы от inline-кнопок.
   * @param {TelegramBot.CallbackQuery} callbackQuery - Callback-запрос.
   */
  private async handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    console.log(callbackQuery);
  }

  /**
   * Обрабатывает текстовые сообщения от пользователя.
   * @param {TelegramBot.Message} msg - Сообщение от пользователя.
   */
  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text ?? '';

    // Тестирование AI и DB
    Logger.warn(text);

    const card = await this.tarotService.getRandomCard();
    const response = await this.aiService.generateAiResponse([
      {
        role: 'system',
        content:
          'Ты профессиональный гадальщик и таролог. Ответь на вопрос пользователя, используя данные о карте, которая будет выбрана случайным образом. Сделай небольшое предсказание в несколько предложение',
      },
      {
        role: 'user',
        content: text,
      },
      {
        role: 'assistant',
        content: `
        Название карты: ${card.name}
        Ссылка на изображение карты: ${card.image_url}
        Базовая интерпретация карты: ${card.base_interpretation_upright}
        Ключевые слова: ${card.keywords_upright}
        Символика: ${card.symbolism}
        Астрологическая ассоциация: ${card.astrological_association}
        `,
      },
    ]);

    await this.bot.sendMessage(chatId, card.name);
    await this.bot.sendPhoto(chatId, card.image_url ?? '');
    await this.bot.sendMessage(chatId, response);
  }
}
