import { readFileSync } from 'node:fs';

function analyzeJsonFile(filename: string) {
  const content = JSON.parse(readFileSync(filename, 'utf-8'));
  return {
    columns: content.columns?.length ?? 0,
    index: content.index?.length ?? 0,
    data: content.data?.length ?? 0
  };
}

const files = {
  close: analyzeJsonFile('./close_price.json'),
  open: analyzeJsonFile('./open_price.json'),
  volume: analyzeJsonFile('./vol_traded.json')
};

console.log('Analysis Results:');
console.log('================');

for (const [fileType, counts] of Object.entries(files)) {
  console.log(`\n${fileType.toUpperCase()} File:`);
  console.log('  columns:', counts.columns);
  console.log('  index:', counts.index);
  console.log('  data:', counts.data);
}