import $, { Cheerio, Element } from 'cheerio';
import { start } from 'repl';

export function jessWorkParser(file: string) {
  const months: { month: Cheerio<Element>; duties: Cheerio<Element> }[] = [];

  for (let i = 0; i < 12; ++i) {
    months[i] = {
      month: $(`#lblMonth${i + 1}`, file),
      duties: $(`#grdDuties${i + 1}`, file)
    };
  }

  return months.map(({ month, duties }) => {
    const [monthName, year] = month
      .text()
      .split('20')
      .map((text) => text.trim());
    const days = processMonth(monthName, year, duties);
    return { monthName, year, days };
  });
}

function parseEvents(
  schedule: string,
  date: Date
): {
  start: Date;
  end: Date;
  description: string;
} {
  if (schedule.includes(':')) {
    const splitString = schedule.split(':');
    const startHours = Number.parseInt(splitString[0]);
    const startMins = Number.parseInt(splitString[1].split(' ')[0]);
    const splitLength = splitString.length;
    const endHours = Number.parseInt(splitString[splitLength - 2].slice(-2));
    const endMins = Number.parseInt(splitString[splitLength - 1].slice(0, 2));

    const start = new Date(date.setHours(startHours, startMins));
    let end = new Date(date.setHours(endHours, endMins));
    if (end < start) end = new Date(end.setDate(end.getDate() + 1));
    return {
      start,
      end,
      description: schedule
    };
  }
  let match;
  if (
    (match = /([0-2][0-9])([0-5][0-9])\-([0-2][0-9])([0-5][0-9])/.exec(
      schedule
    ))
  ) {
    if (match.length === 5) {
      console.log(schedule);
      console.log(match[1], match[2], match[3], match[4]);
      const start = new Date(
        date.setHours(Number.parseInt(match[1]), Number.parseInt(match[2]))
      );
      let end = new Date(
        date.setHours(Number.parseInt(match[3]), Number.parseInt(match[4]))
      );
      if (end < start) end = new Date(end.setDate(end.getDate() + 1));
      return {
        start,
        end,
        description: schedule
      };
    }
  }
  // if (schedule.includes('Rest Day')) {
  // }

  return { start: date, end: date, description: schedule };
}

function processMonth(
  monthName: string,
  year: string,
  duties: Cheerio<Element>
) {
  const days = $('td', duties);
  const dayValues = days
    .map((_, day) => {
      const dayText = $(day).text();
      const [dayNumber, schedule] = dayText
        .trim()
        .split('\n')
        .map((text) => text.trim());

      if (!dayNumber || !schedule) return;
      const date = new Date(
        Date.parse(`${monthName} ${dayNumber}, 20${year} 00:00:00Z`)
      );

      const events = parseEvents(schedule, date);
      return { dayNumber, date, events, dayText };
    })
    .toArray()
    .filter((text) => {
      return text.date;
    });
  return dayValues;
}
