import {stringifyMarkdown} from '@vivliostyle/vfm';

function convert(input: string) {
  return stringifyMarkdown(input);
}

console.log(convert(process.argv[2]));
