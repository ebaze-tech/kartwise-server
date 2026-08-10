import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { UserRegisteredEvent } from '../accounts/events/user-registered.event';
import { SentEmail } from '@prisma/client';
import { sendEmail } from '../utils/resend.utils';
import { UserLoggedInEvent } from '../accounts/events/user-loggedin.event';
import { Cron, CronExpression } from '@nestjs/schedule';
import { config } from 'dotenv';
import { ChangeEmailRequestEvent } from '../accounts/events/change-email-request.event';
import { ChangeEmailConfirmationEvent } from '../accounts/events/change-email-confirmation.event';
import { PasswordResetRequestedEvent } from '../accounts/events/password-reset-requested.event';
import { ResetPasswordConfirmationEvent } from '../accounts/events/reset-password-confirmation.event';
import { EmailVerifiedEvent } from '../accounts/events/email-verified.event';
import { AccountDeletedEvent } from '../accounts/events/account-deleted.event';
import { ResendOtpEvent } from '../accounts/events/resend-otp.event';
import { BusinessCreatedEvent } from '../business/events/business-created.event';

config();
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
          subject: 'Welcome to KartWise!',
          from: process.env.WELCOME_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to KartWise</title>
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
                KartWise
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
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Here's the OTP for activating your newly created account ${event.otp}
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
                © 2026 KartWise. All rights reserved.
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

      const sendEmail = await this.trySend(email);

      console.log(sendEmail);
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
          from: process.env.LOGIN_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Notification - KartWise</title>
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
                KartWise
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
                We noticed a recent login to your KartWise account. If this was you, you can safely ignore this email. 
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
                          <a href="https://kartwise.com.ng/reset-password" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: inherit; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 50px;">
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
                © 2026 KartWise. All rights reserved.
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

      const sendEmail = await this.trySend(email);

      console.log(sendEmail);
    } catch (error) {
      console.error('Error sending login email:', error);
    }
  }

  async sendEmailChangeNotification(
    event: ChangeEmailRequestEvent,
  ): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.newEmail,
          subject: 'Confirm your new email address',
          from: process.env.EMAIL_CHANGE_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your New Email - KartWise</title>
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
                KartWise
              </h1>
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: left;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold; text-align: center;">
                Confirm Your Email Address
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We received a request to change the email address associated with your KartWise account to this one. Please use the verification code below to complete the process.
              </p>

              <!-- OTP Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 40px; display: inline-block;">
                      <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">
                        ${event.otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                This code will expire in 10 minutes.
              </p>
              
              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you did not request this change, you can safely ignore this email. Your account will remain associated with your current email address.
              </p>
              
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} KartWise. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is an automated message, please do not reply directly to this email.
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
          eventType: 'user.emailChangeRequested',
        },
      });

      const sendEmail = await this.trySend(email);

      console.log(sendEmail);
    } catch (error) {
      console.error('Error sending email change notification:', error);
    }
  }

  async sendEmailChangeConfirmationNotification(
    event: ChangeEmailConfirmationEvent,
  ): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.newEmail,
          subject: 'Email Changed Successfully',
          from: process.env.EMAIL_CHANGE_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Changed Successfully - KartWise</title>
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
                KartWise
              </h1>
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: left;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold; text-align: center;">
                Email Updated Successfully
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                This email confirms that your KartWise account's email address has been successfully updated to this one.
              </p>

              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You can now use this email address to log into your account.
              </p>

              <!-- Bulletproof Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#10b981" style="border-radius: 50px;">
                          <!-- Note: Using brand green (#10b981) for positive action -->
                          <a href="https://kartwise.com.ng/login" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: inherit; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 50px;">
                            Log In Now
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you did not authorize this change, please contact our support team immediately to secure your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} KartWise. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is an automated message confirming an account change.<br>
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
          eventType: 'user.emailChangedSuccessfully',
        },
      });

      const sendEmail = await this.trySend(email);

      console.log(sendEmail);
    } catch (error) {
      console.error('Error sending email change confirmation:', error);
    }
  }

  async sendPasswordResetNotification(
    event: PasswordResetRequestedEvent,
  ): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.email,
          subject: 'Your Password Reset Code',
          // Assuming you have an env variable for this, adjust if necessary
          from:
            process.env.AUTH_NOTIFICATION_MAIL ||
            process.env.EMAIL_CHANGE_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - KartWise</title>
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
                KartWise
              </h1>
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: left;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold; text-align: center;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your KartWise account. Enter the code below to set a new password.
              </p>

              <!-- OTP Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 40px; display: inline-block;">
                      <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">
                        ${event.otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                This code will expire in 15 minutes.
              </p>
              
              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you did not request a password reset, please safely ignore this email. Your password will remain unchanged and your account is secure.
              </p>
              
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} KartWise. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is an automated message requested by a user on our platform.<br>
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
          eventType: 'user.passwordResetRequested',
        },
      });

      const sendEmail = await this.trySend(email);

      console.log(sendEmail);
    } catch (error) {
      console.error('Error sending password reset notification:', error);
    }
  }

  async sendPasswordChangedNotification(
    event: ResetPasswordConfirmationEvent,
  ): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.email,
          subject: 'Password Changed Successfully',
          from: process.env.PASSWORD_CHANGE_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed - KartWise</title>
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
                KartWise
              </h1>
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: left;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold; text-align: center;">
                Password Updated Successfully
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                This email is to confirm that the password for your KartWise account was recently changed. You can now use your new password to log in.
              </p>

              <!-- Bulletproof Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#10b981" style="border-radius: 50px;">
                          <a href="https://KartWise.com.ng/login" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: inherit; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 50px;">
                            Log In Now
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #ef4444; font-size: 14px; line-height: 1.6; font-weight: 500;">
                Didn't make this change?
              </p>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you did not authorize this action, please contact our support team immediately to secure your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} KartWise. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is an automated security alert regarding your account.<br>
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
          eventType: 'user.passwordChangedSuccessfully',
        },
      });

      const sendEmail = await this.trySend(email);

      console.log(sendEmail);
    } catch (error) {
      console.error(
        'Error sending password change confirmation notification:',
        error,
      );
    }
  }

  async sendEmailVerifiedNotification(
    event: EmailVerifiedEvent,
  ): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.email,
          subject: 'Email Verified Successfully',
          from:
            process.env.AUTH_NOTIFICATION_MAIL ||
            process.env.EMAIL_CHANGE_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified - KartWise</title>
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
                KartWise
              </h1>
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: left;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold; text-align: center;">
                Email Verified!
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for verifying your email address. Your KartWise account is now fully set up, secure, and ready to go!
              </p>

              <!-- Bulletproof Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#10b981" style="border-radius: 50px;">
                          <a href="https://KartWise.com.ng/dashboard" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: inherit; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 50px;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                We are thrilled to have you with us. If you have any questions or need assistance, feel free to reach out to our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} KartWise. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is an automated message confirming your account status.<br>
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
          eventType: 'user.emailVerified',
        },
      });

      const sendEmail = await this.trySend(email);

      console.log(sendEmail);
    } catch (error) {
      console.error(
        'Error sending email verification success notification:',
        error,
      );
    }
  }

  async sendAccountDeletedNotification(
    event: AccountDeletedEvent,
  ): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.email,
          subject: 'Account Deleted Successfully',
          from: process.env.ACCOUNT_DELETION_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted - KartWise</title>
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
                KartWise
              </h1>
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: left;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold; text-align: center;">
                Account Successfully Deleted
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We are writing to confirm that your KartWise account and all associated data have been permanently deleted as per your request.
              </p>

              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We are sorry to see you go! If you ever change your mind in the future, you are always welcome to come back and create a new account.
              </p>
              
              <p style="margin: 0; color: #ef4444; font-size: 14px; line-height: 1.6; font-weight: 500;">
                Didn't make this request?
              </p>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you did not authorize the deletion of your account, please contact our support team immediately, and we will do our best to assist you.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} KartWise. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is an automated message confirming your account deletion.<br>
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
          eventType: 'user.accountDeleted',
        },
      });

      const sendEmail = await this.trySend(email);

      console.log(sendEmail);
    } catch (error) {
      console.error('Error sending account deletion notification:', error);
    }
  }

  async sendResendVerificationEmail(event: ResendOtpEvent): Promise<void> {
    try {
      const email = await this.prisma.sentEmail.create({
        data: {
          userId: event.userId,
          recipient: event.email,
          subject: 'Your New Verification Code',
          from: process.env.VERIFICATION_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code - KartWise</title>
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
                KartWise
              </h1>
            </td>
          </tr>

          <!-- Main Copy -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: left;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold; text-align: center;">
                Your New Verification Code
              </h2>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${event.username || 'there'},
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You recently requested a new verification code for your KartWise account. Please use the code below to complete your registration.
              </p>

              <!-- OTP Display Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 40px; display: inline-block;">
                      <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">
                        ${event.otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                This code will expire in 24 hours.
              </p>
              
              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you did not request this code, you can safely ignore this email.
              </p>
              
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                © ${new Date().getFullYear()} KartWise. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is an automated message requested by a user on our platform.<br>
                Please do not reply directly to this email.
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
          eventType: 'user.verificationEmailResent',
        },
      });

      // Send the email exactly once
      await this.trySend(email);
    } catch (error) {
      console.error('Error sending resend verification email:', error);
    }
  }

  async sendBusinessWelcomeEmail(event: BusinessCreatedEvent): Promise<void> {
    try {
      // Fetch the owner to get their email address and first name
      const owner = await this.prisma.user.findUnique({
        where: { id: event.ownerId },
      });

      if (!owner) {
        console.error(`Owner not found for business: ${event.businessId}`);
        return;
      }

      const email = await this.prisma.sentEmail.create({
        data: {
          userId: owner.id,
          recipient: owner.email,
          subject: 'Your Store is Live on KartWise! 🚀',
          from: process.env.WELCOME_NOTIFICATION_MAIL!,
          body: `
          <!DOCTYPE html>
          <html lang="en">
          <body style="margin: 0; padding: 20px; font-family: sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px;">
              <h2 style="color: #111827; text-align: center;">Congratulations, ${owner.firstName}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your business <strong>${event.businessName}</strong> has been successfully registered on KartWise.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You can now start adding products to your catalog and reaching buyers across campus.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://your-app-link.com/dashboard" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Go to Dashboard
                </a>
              </div>
            </div>
          </body>
          </html>`,
          status: 'PENDING',
          attempts: 0,
          eventType: 'business.created',
        },
      });

      await this.trySend(email);
    } catch (error) {
      console.error('Error sending business welcome email:', error);
    }
  }

  private async trySend(email: SentEmail) {
    try {
      const sendEmailResult = await sendEmail({
        to: email.recipient,
        subject: email.subject,
        text: email.body,
        html: email.body,
        from: email.from,
      });

      const sentEmailUpdatedData = await this.prisma.sentEmail.update({
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

      console.log(sendEmailResult);

      console.log(sentEmailUpdatedData);
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
