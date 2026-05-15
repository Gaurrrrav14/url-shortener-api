import { encode } from './src/utils/base62.js';

console.log(encode(1));     // '1'
console.log(encode(62));    // '10'
console.log(encode(1000));  // 'g8'