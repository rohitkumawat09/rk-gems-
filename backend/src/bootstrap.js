import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
console.log('[BOOTSTRAP] loaded .env, SENDGRID_API_KEY present?', !!process.env.SENDGRID_API_KEY);

// Dynamically import server after env is loaded to avoid ESM static-import hoisting
await import('./server.js');
