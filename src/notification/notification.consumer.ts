import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserRegisteredEvent } from '../accounts/events/user-registered.event';
import { NotificationService } from './notification.service';
import { UserLoggedInEvent } from '../accounts/events/user-loggedin.event';
import { ChangeEmailRequestEvent } from '../accounts/events/change-email-request.event';
import { ChangeEmailConfirmationEvent } from '../accounts/events/change-email-confirmation.event';
import { PasswordResetRequestedEvent } from '../accounts/events/password-reset-requested.event';
import { ResetPasswordConfirmationEvent } from '../accounts/events/reset-password-confirmation.event';
import { EmailVerifiedEvent } from '../accounts/events/email-verified.event';
import { AccountDeletedEvent } from '../accounts/events/account-deleted.event';
import { ResendOtpEvent } from '../accounts/events/resend-otp.event';

@Controller()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user.registered')
  async handleUserRegisteredEvent(@Payload() event: UserRegisteredEvent) {
    console.log('Received user.registered event:', event);
    return await this.notificationService.sendWelcomeEmail(event);
  }

  @EventPattern('user.loggedIn')
  async handleUserLoggedInEvent(@Payload() event: UserLoggedInEvent) {
    console.log('Received user.loggedIn event:', event);
    return await this.notificationService.sendLoginNotification(event);
  }

  @EventPattern('user.emailChangeRequested')
  async handleUserEmailChangeRequestEvent(
    @Payload() event: ChangeEmailRequestEvent,
  ) {
    console.log('Received user.emailChangeRequested event:', event);
    return await this.notificationService.sendEmailChangeNotification(event);
  }

  @EventPattern('user.emailChangedSuccessfully')
  async handleChangeEmailConfirmationEvent(
    @Payload() event: ChangeEmailConfirmationEvent,
  ) {
    console.log('Received user.emailChangedSuccessfully event:', event);
    return await this.notificationService.sendEmailChangeConfirmationNotification(
      event,
    );
  }

  @EventPattern('user.passwordResetRequested')
  async handlePasswordResetRequestedEvent(
    @Payload() event: PasswordResetRequestedEvent,
  ) {
    console.log('Received user.passwordResetRequested event:', event);
    return await this.notificationService.sendPasswordResetNotification(event);
  }

  @EventPattern('user.passwordChangedSuccessfully')
  async handlePasswordChangedSuccessfullyEvent(
    @Payload() event: ResetPasswordConfirmationEvent,
  ) {
    console.log('Received user.passwordChangedSuccessfully event:', event);
    return await this.notificationService.sendPasswordChangedNotification(
      event,
    );
  }

  @EventPattern('user.emailVerified')
  async handleEmailVerifiedEvent(@Payload() event: EmailVerifiedEvent) {
    console.log('Received user.emailVerified event:', event);
    return await this.notificationService.sendEmailVerifiedNotification(event);
  }

  @EventPattern('user.verificationEmailResent')
  async handleVerificationEmailResentEvent(@Payload() event: ResendOtpEvent) {
    // Type this with a proper Event class if you wish
    return await this.notificationService.sendResendVerificationEmail(event);
  }

  @EventPattern('user.accountDeleted')
  async handleAccountDeletedEvent(@Payload() event: AccountDeletedEvent) {
    console.log('Received user.accountDeleted event:', event);
    return await this.notificationService.sendAccountDeletedNotification(event);
  }
}
