import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserRegisteredEvent } from '../accounts/events/user-registered.event';
import { NotificationService } from './notification.service';
import { UserLoggedInEvent } from '../accounts/events/user-loggedin.event';

@Controller()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user.registered')
  async handleUserRegisteredEvent(@Payload() event: UserRegisteredEvent) {
    return await this.notificationService.sendWelcomeEmail(event);
  }

  @EventPattern('user.loggedIn')
  async handleUserLoggedInEvent(@Payload() event: UserLoggedInEvent) {
    return await this.notificationService.sendLoginNotification(event);
  }
}
