import express, { json } from 'express';

import { getEnv } from 'shared/env';
import { devSetup } from 'devSetup';
import { Bot, webhookCallback } from 'grammy';
import { v4 as uuid } from 'uuid';
import { registerCommands } from 'command/commands';
import { registerEvent } from 'event/events';
import ical from 'ical-generator';
import { jessWorkParser } from 'parsers/jessWork';
import fs from 'fs';

export async function handler(): Promise<void> {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN must be provided!');
  }

  if (getEnv('NODE_ENV') === 'development') {
    await devSetup();
  }

  const bot = new Bot(token);

  registerCommands(bot);
  registerEvent(bot);

  const host = getEnv('host');
  const secretPath = `/grammy/${uuid()}`;

  await bot.api.setWebhook(`${host}${secretPath}`);

  const app = express();
  app.use(json());
  app.use(secretPath, webhookCallback(bot, 'express'));

  const calendar = ical({ name: 'my first iCal' });

  const result = jessWorkParser(
    fs.readFileSync('./__tests__/testData/jessWork.htm').toString('utf-8')
  );

  result.forEach((month) => {
    month.days.forEach((day) => {
      calendar.createEvent({
        start: day.events?.start ?? day.date,
        end: day.events?.end ?? day.date,
        summary: day.dayText,
        description: day.dayText
      });
    });
  });

  app.use('/ical', (req, res) => {
    console.log('received request');
    calendar.serve(res);
  });

  app.listen(3000, () => {
    console.log('Webhook Server Started!');
    console.log('Host:', host);
  });
}

handler()
  .then(() => console.log('Bot Running'))
  .catch((error) => {
    console.error('Uncaught Error Thrown', error);
  });
