import { Resend } from 'resend';
import { config } from 'dotenv';

config();

const apiKey = process.env.RESEND_API_KEY;
const WELCOME_NOTIFICATION_MAIL = process.env.WELCOME_NOTIFICATION_MAIL;
const LOGIN_NOTIFICATION_MAIL = process.env.LOGIN_NOTIFICATION_MAIL;
if (!apiKey) {
  throw new BadRequestException('RESEND_API_KEY is missing');
}

if (!WELCOME_NOTIFICATION_MAIL || !LOGIN_NOTIFICATION_MAIL) {
  throw new BadRequestException('WELCOME_NOTIFICATION_MAIL is missing');
}

const resend = new Resend(apiKey);

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from: string;
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from,
}: SendEmailOptions) => {
  if (!text && !html) {
    throw new BadRequestException('Either text or html must be provided.');
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
