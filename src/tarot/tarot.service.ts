import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class TarotService {
  constructor(private readonly db: DbService) {}

  async getRandomCard() {
    const count = await this.db.card.count();
    const skip = Math.floor(Math.random() * count);
    return await this.db.card.findMany({
      take: 5,
      skip: skip,
      orderBy: {
        id: 'asc',
      },
    });
  }
}
