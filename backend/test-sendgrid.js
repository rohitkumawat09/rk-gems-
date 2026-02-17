import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sgMail from '@sendgrid/mail';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

if (!process.env.SENDGRID_API_KEY) {
  console.error('No SENDGRID_API_KEY found in .env');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: process.env.SENDGRID_TEST_TO || process.env.SENDGRID_FROM_EMAIL,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'SendGrid test message',
  text: 'This is a test message from test-sendgrid.js',
};

sgMail.send(msg)
  .then(() => console.log('SendGrid test email sent'))
  .catch((err) => console.error('SendGrid send error:', err.response?.body || err.message || err));
