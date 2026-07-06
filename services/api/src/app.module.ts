import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizerProfilesModule } from './modules/organizer-profiles/organizer-profiles.module';
import { EventsModule } from './modules/events/events.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import envConfig from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizerProfilesModule,
    EventsModule,
    RegistrationsModule,
    PaymentsModule,
    CheckinsModule,
    FeedbacksModule,
    CertificatesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
