import { Module, forwardRef } from '@nestjs/common';
import { StoresModule } from '../../stores';
import { VendorsModule } from '../../vendors';
import { OwnershipVerifier } from './ownership-verifier';

@Module({
  imports: [forwardRef(() => StoresModule), VendorsModule],
  providers: [OwnershipVerifier],
  exports: [OwnershipVerifier],
})
export class OwnershipModule {}
