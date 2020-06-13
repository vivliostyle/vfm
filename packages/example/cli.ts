import fs from 'fs';
import {stringifyMarkdown} from '@vivliostyle/vfm';

function convert(filepath: string) {
  const input = fs.readFileSync(filepath).toString();
  return stringifyMarkdown(input);
}

if (process.argv.length < 3) {
  console.log('ts-node cli.ts <path/to/markdown>');
  process.exit(1);
}

console.log(convert(process.argv[2]));
