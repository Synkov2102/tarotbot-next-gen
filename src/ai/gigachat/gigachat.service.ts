import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { AiMessage, AiProvider } from '../ai.interface';

@Injectable()
export class GigaChatService implements AiProvider {
  private readonly API_URL = 'https://gigachat.devices.sberbank.ru/api/v1';
  private readonly TOKEN_URL =
    'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
  private readonly TOKEN_FILE_PATH = path.join(__dirname, 'token.json'); // Путь к файлу токена
  private token: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Метод для чтения токена из файла
  private async loadTokenFromFile(): Promise<void> {
    if (fs.existsSync(this.TOKEN_FILE_PATH)) {
      const data = await fs.promises.readFile(this.TOKEN_FILE_PATH, 'utf-8');
      const tokenData = JSON.parse(data);
      this.token = tokenData.token;
      this.tokenExpiresAt = tokenData.expiresAt;
    }
  }

  // Метод для сохранения токена в файл
  private async saveTokenToFile(
    token: string | null,
    expiresAt: number,
  ): Promise<void> {
    const tokenData = { token, expiresAt };
    await fs.promises.writeFile(
      this.TOKEN_FILE_PATH,
      JSON.stringify(tokenData),
    );
  }

  // Метод для получения токена, если его нет или он истек
  private async ensureToken() {
    const clientAPIKey = this.configService.get<string>('GIGACHAT_API_KEY');
    const scope = 'GIGACHAT_API_PERS';
    const currentTime = Math.floor(Date.now() / 1000); // Текущее время в секундах

    if (!clientAPIKey) {
      throw new HttpException(
        'Не заданы учетные данные для GigaChat',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (
      this.token &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt > currentTime
    ) {
      return; // Токен еще действителен
    }

    try {
      await this.loadTokenFromFile(); // Попытаться загрузить токен из файла

      // Если токен не найден или истек, получаем новый
      if (
        !this.token ||
        !this.tokenExpiresAt ||
        this.tokenExpiresAt <= currentTime
      ) {
        const body = new URLSearchParams();
        body.append('scope', scope);

        const response = await firstValueFrom(
          this.httpService.post(this.TOKEN_URL, body.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
              Authorization: `Basic ${clientAPIKey}`,
              RqUID: uuidv4(),
            },
          }),
        );

        this.token = response.data.access_token;
        this.tokenExpiresAt = response.data.expires_at; // Время истечения токена (timestamp)

        await this.saveTokenToFile(this.token, this.tokenExpiresAt ?? 0); // Сохраняем токен в файл
      }
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Ошибка авторизации',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // Умная функция для отправки запросов в GigaChat
  async generateAiResponse(messages: AiMessage[]): Promise<string> {
    await this.ensureToken(); // Проверяем и обновляем токен

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.API_URL}/chat/completions`,
          { model: 'GigaChat', messages },
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      // Если токен недействителен, повторяем запрос после обновления токена
      if (error.response?.status === 401) {
        this.token = null;
        return this.generateAiResponse(messages);
      }

      throw new HttpException(
        error.response?.data || 'Ошибка чата',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
