import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { AiService } from 'src/ai/ai.service';

@Injectable()
export class TelegramBotService {
  private token = process.env.TELEGRAM_BOT_TOKEN; // Используем переменную окружения
  private bot: TelegramBot;

  constructor(private aiService: AiService) {
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
    const text = msg.text;

    const ai = await this.aiService.sendMessage([
      {
        role: 'system',
        content: text,
      },
    ]);

    await this.bot.sendMessage(chatId, ai?.choices[0]?.message.content);
  }
}
