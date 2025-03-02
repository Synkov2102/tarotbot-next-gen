import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const logger = new Logger('Seed');

async function main() {
  logger.log('Начало заполнения базы данных...');

  const tarotCards = JSON.parse(
    fs.readFileSync(path.join(__dirname, './cards.json'), 'utf8'),
  );

  await prisma.card.deleteMany({});

  for (const card of tarotCards) {
    await prisma.card.create({
      data: card,
    });
  }

  logger.log(
    `База данных успешно заполнена. Добавлено ${tarotCards.length} карт.`,
  );
}

main()
  .catch((e) => {
    logger.error(`Ошибка при заполнении базы данных: ${e}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
