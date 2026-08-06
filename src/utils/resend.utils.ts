import { Resend } from 'resend';
import { config } from 'dotenv';

config();

const apiKey = process.env.RESEND_API_KEY;
const defaultFrom = process.env.RESEND_FROM;

if (!apiKey) {
  throw new Error('RESEND_API_KEY is missing');
}

if (!defaultFrom) {
  throw new Error('RESEND_FROM is missing');
}

const resend = new Resend(apiKey);

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from = defaultFrom,
}: SendEmailOptions) => {
  if (!text && !html) {
    throw new Error('Either text or html must be provided.');
  }

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });

    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
