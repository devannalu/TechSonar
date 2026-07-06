import { Module } from '@nestjs/common';
import { OrganizerProfilesController } from './organizer-profiles.controller';
import { OrganizerProfilesService } from './organizer-profiles.service';

@Module({
  controllers: [OrganizerProfilesController],
  providers: [OrganizerProfilesService],
  exports: [OrganizerProfilesService],
})
export class OrganizerProfilesModule {}
