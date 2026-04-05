import { Module } from '@nestjs/common';
import {
  GetVendorProfile,
  CreateVendorProfile,
  UpdateVendorProfile,
} from '@ecomsaas/application/use-cases';
import { createIdGenerator } from '@ecomsaas/infrastructure/id-generator';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VENDOR_PROFILE_REPOSITORY } from './vendor.tokens';
import { SupabaseVendorProfileRepository } from './repositories/supabase-vendor-profile.repository';

@Module({
  controllers: [VendorsController],
  providers: [
    VendorsService,
    SupabaseVendorProfileRepository,
    {
      provide: VENDOR_PROFILE_REPOSITORY,
      useExisting: SupabaseVendorProfileRepository,
    },
    {
      provide: GetVendorProfile,
      useFactory: (repo: SupabaseVendorProfileRepository) => new GetVendorProfile(repo),
      inject: [SupabaseVendorProfileRepository],
    },
    {
      provide: CreateVendorProfile,
      useFactory: (repo: SupabaseVendorProfileRepository) =>
        new CreateVendorProfile(repo, createIdGenerator()),
      inject: [SupabaseVendorProfileRepository],
    },
    {
      provide: UpdateVendorProfile,
      useFactory: (repo: SupabaseVendorProfileRepository) => new UpdateVendorProfile(repo),
      inject: [SupabaseVendorProfileRepository],
    },
  ],
  exports: [VendorsService, VENDOR_PROFILE_REPOSITORY],
})
export class VendorsModule {}
