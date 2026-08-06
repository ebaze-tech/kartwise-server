import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { UserRegisteredEvent } from '../accounts/events/user-registered.event';
import { SentEmail } from '@prisma/client';
import { sendEmail } from '../utils/resend.utils';
import { UserLoggedInEvent } from '../accounts/events/user-loggedin.event';
import { env } from 'prisma/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaService: KafkaService,
  ) {}

  async sendWelcomeEmail(event: UserRegisteredEvent): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.email,
          subject: 'Welcome to UniMart!',
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to UniMart</title>
  <!--[if mso]>
  <style>
    table {border-collapse: collapse; border-spacing: 0; margin: 0;}
    div, td {padding: 0;}
    div {margin: 0 !important;}
  </style>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <!-- Outer Background Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Inner Content Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding: 40px 0 20px 0; background-color: #ffffff;">
              <!-- Replace with your actual logo URL -->
              <h1 style="margin: 0; color: #10b981; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                UniMart
              </h1>
            </td>
          </tr>

          <!-- Hero Image (Optional) -->
          <tr>
            <td align="center" style="padding: 0 40px;">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Students collaborating" width="100%" style="max-width: 100%; height: auto; border-radius: 8px; display: block;">
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 30px 40px 40px 40px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold;">
                Welcome to the community, ${event.username}! 🎉
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We are thrilled to have you here. Get ready to discover unique campus gems and support student-owned businesses right here on your campus.
              </p>
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                From freshly baked goods to unique crafts, the best of what our campus has to offer is now just a tap away. Join hundreds of students already trading today.
              </p>

              <!-- Bulletproof Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#10b981" style="border-radius: 50px;">
                          <a href="https://your-app-link.com" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: inherit; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 50px;">
                            Start Exploring
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © 2026 UniMart. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                You are receiving this email because you recently created an account.<br>
                <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> if you no longer wish to receive these emails.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`,
          status: 'PENDING',
          attempts: 0,
          eventType: 'user.registered',
        },
      });

      await this.trySend(email);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  async sendLoginNotification(event: UserLoggedInEvent): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.email,
          subject: 'New Login Notification',
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Notification - UniMart</title>
  <!--[if mso]>
  <style>
    table {border-collapse: collapse; border-spacing: 0; margin: 0;}
    div, td {padding: 0;}
    div {margin: 0 !important;}
  </style>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <!-- Outer Background Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Inner Content Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding: 40px 0 20px 0; background-color: #ffffff;">
              <h1 style="margin: 0; color: #10b981; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                UniMart
              </h1>
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: left;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold; text-align: center;">
                New Login Detected
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We noticed a recent login to your UniMart account. If this was you, you can safely ignore this email. 
              </p>

              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you did not authorize this login, please secure your account immediately by resetting your password.
              </p>

              <!-- Bulletproof Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#ef4444" style="border-radius: 50px;">
                          <!-- Note: Using red (#ef4444) for security alerts creates visual urgency -->
                          <a href="https://unimart.com.ng/reset-password" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: inherit; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 50px;">
                            Secure My Account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © 2026 UniMart. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is a mandatory security alert regarding your account.<br>
                Please do not reply directly to this email.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
          `,
          status: 'PENDING',
          attempts: 0,
          eventType: 'user.loggedin',
        },
      });
      await this.trySend(email);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  private async trySend(email: SentEmail) {
    try {
      await sendEmail({
        to: email.recipient,
        subject: email.subject,
        text: email.body,
        html: email.body,
      });
      await this.prisma.sentEmail.update({
        where: { id: email.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          attempts: {
            increment: 1,
          },
          errorMessage: null,
        },
      });
    } catch (error: string | any) {
      console.error('Error sending email:', error);
      await this.prisma.sentEmail.update({
        where: { id: email.id },
        data: {
          status: 'FAILED',
          attempts: {
            increment: 1,
          },
          errorMessage: error,
          lastAttemptAt: new Date(),
        },
      });
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutbox() {
    const events = await this.prisma.outbox.findMany({
      where: {
        status: 'PENDING',
      },
      take: 20,
    });

    for (const event of events) {
      try {
        await this.kafkaService.publish(event.topic, event.payload);

        await this.prisma.outbox.update({
          where: {
            id: event.id,
          },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
      } catch (error) {
        await this.prisma.outbox.update({
          where: {
            id: event.id,
          },
          data: {
            retryCount: {
              increment: 1,
            },
          },
        });

        console.error(error);
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async retryFailedEmails() {
    const emails = await this.prisma.sentEmail.findMany({
      where: {
        status: 'FAILED',

        attempts: {
          lt: 5,
        },
      },
    });

    for (const email of emails) {
      await this.trySend(email);
    }
  }
}
