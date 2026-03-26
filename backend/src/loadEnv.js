import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 FORCE load env BEFORE anything else
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

console.log('ENV LOADED:', process.env.SHOPIFY_SCOPES);