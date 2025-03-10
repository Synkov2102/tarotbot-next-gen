import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { AiProviderBrand } from 'src/ai/ai.interface';
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

    const cards = await this.tarotService.getThreeRandomCards();

    const cardsText = cards
      .map((card) => {
        const isReversed = card.position === 'reversed';

        return `Название карты: ${card.name}
        Ссылка на изображение карты: ${card.image_url ?? 'Нет изображения'}
        Базовая интерпретация карты: ${isReversed ? card.base_interpretation_reversed : card.base_interpretation_upright}
        Ключевые слова: ${isReversed ? card.keywords_reversed : card.keywords_upright}
        Символика: ${card.symbolism ?? 'Нет данных'}
        Астрологическая ассоциация: ${card.astrological_association ?? 'Нет данных'}
        Положение карты: ${isReversed ? 'Перевёрнутое' : 'Прямое'}
        `;
      })
      .join('\n-----------------\n');

    const promt = [
      {
        role: 'system',
        content:
          'Ты профессиональный таролог. Ответь на вопрос пользователя, используя данные о карте, которая будет выбрана случайным образом. Сделай небольшое предсказание в несколько предложение' +
          'По контексту вопроса необходимо выбрать схему расклада и в соответствии с ней трактовать карты. Какие расклады Таро возможны: Ваше прошлое (карта 1), ваше настоящее (карта 2) и ваше будущее (карта 3); Вы (1), ваш жизненный путь (2), ваш потенциал (3); Вы (1), ваши отношения (2), ваш партнер (3); Ситуация (1), действие (2), исход (3); Идея (1), процесс (2) и стремление (3).' +
          'Выпали следующие карты в таком порядке: ' +
          cardsText,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const GigaResponse = await this.aiService.generateAiResponse(
      promt,
      AiProviderBrand.GIGACHAT,
    );

    const DepSeekResponse = await this.aiService.generateAiResponse(
      promt,
      AiProviderBrand.DEEPSEEK,
    );

    // Отправляем информацию по каждой карте по очереди
    for (const card of cards) {
      await this.bot.sendMessage(chatId, `Карта: ${card.name}`);

      if (card.image_url) {
        await this.bot.sendPhoto(chatId, card.image_url);
      }

      await this.bot.sendMessage(
        chatId,
        `Базовая интерпретация: ${card.base_interpretation_upright}`,
      );

      await this.bot.sendMessage(
        chatId,
        `Астрологическая ассоциация: ${card.astrological_association ?? 'Нет данных'}`,
      );
    }

    // Отправляем AI ответы
    await this.bot.sendMessage(chatId, 'GigaChat: ' + GigaResponse);
    await this.bot.sendMessage(chatId, 'DeepSeek: ' + DepSeekResponse);
  }
}
