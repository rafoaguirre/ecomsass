import { Module } from '@nestjs/common';
import { VendorsModule } from '../vendors';
import { StoresModule } from '../stores';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [VendorsModule, StoresModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
