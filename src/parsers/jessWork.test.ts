import { jessWorkParser } from 'parsers/jessWork';
import * as fs from 'fs';

it('test', () => {
  const result = jessWorkParser(
    fs.readFileSync('./__tests__/testData/jessWork.htm').toString('utf-8')
  );

  console.log(JSON.stringify(result, null, 2));

  expect(result).not.toBeNull();
});
