import { writeFile, rename } from 'node:fs/promises';
import { fetchPortfolio } from '../src/portfolio.mjs';
const data = await fetchPortfolio();
const target = new URL('../assets/youtube-portfolio.json', import.meta.url);
const temporary = new URL('../assets/youtube-portfolio.json.tmp', import.meta.url);
await writeFile(temporary, JSON.stringify(data, null, 2) + '\n');
await rename(temporary, target);
console.log(`Saved ${data.items.length} actual YouTube broadcasts at ${data.updatedAt}`);
