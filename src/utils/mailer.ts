import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface sendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from = process.env.SMTP_FROM!,
}: sendEmailOptions): Promise<void> => {
  try {
    await transporter.verify();
    await transporter.sendMail({ from, to, subject, text, html });

    return;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};
