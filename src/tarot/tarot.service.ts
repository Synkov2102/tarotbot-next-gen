import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class TarotService {
  constructor(private readonly db: DbService) {}

  async getRandomCard() {
    const count = await this.db.card.count();
    const skip = Math.floor(Math.random() * count);
    const cards = await this.db.card.findMany({
      take: 5,
      skip: skip,
      orderBy: {
        id: 'asc',
      },
    });
    return cards[0];
  }

  async getThreeRandomCards() {
    const count = await this.db.card.count();
    if (count < 3) throw new Error('Недостаточно карт в базе');

    // Получаем три случайных уникальных индекса
    const randomIndexes = new Set<number>();
    while (randomIndexes.size < 3) {
      randomIndexes.add(Math.floor(Math.random() * count));
    }

    // Получаем три случайные карты по их индексам
    const randomCards = await Promise.all(
      Array.from(randomIndexes).map((index) =>
        this.db.card.findFirst({
          skip: index,
          orderBy: { id: 'asc' },
        }),
      ),
    );

    // Добавляем случайное положение (upright или reversed)
    return randomCards.map((card) => ({
      ...card,
      position: Math.random() < 0.5 ? 'upright' : 'reversed',
    }));
  }
}
