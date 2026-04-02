import { describe, it, expect } from 'vitest';
import { VendorProfileModel } from './VendorProfileModel';
import { AddressType, VerificationStatus } from '../enums';

describe('VendorProfileModel', () => {
  const validInput = {
    id: 'vendor-1',
    userId: 'user-1',
    businessName: 'Test Business',
  };

  describe('create', () => {
    it('creates a model with defaults', () => {
      const vendor = VendorProfileModel.create(validInput);

      expect(vendor.id).toBe('vendor-1');
      expect(vendor.userId).toBe('user-1');
      expect(vendor.businessName).toBe('Test Business');
      expect(vendor.addresses).toEqual([]);
      expect(vendor.verificationStatus).toBe(VerificationStatus.Unverified);
      expect(vendor.stripeConnectId).toBeUndefined();
      expect(vendor.agreementAccepted).toBe(false);
      expect(vendor.onboardingCompleted).toBe(false);
      expect(vendor.metadata).toEqual({});
    });

    it('throws on missing business name', () => {
      expect(() => VendorProfileModel.create({ ...validInput, businessName: '' })).toThrow(
        'Vendor business name is required'
      );
    });

    it('throws on missing user ID', () => {
      expect(() => VendorProfileModel.create({ ...validInput, userId: '' })).toThrow(
        'Vendor user ID is required'
      );
    });
  });

  describe('fromData', () => {
    it('reconstitutes from persisted data', () => {
      const now = new Date();
      const vendor = VendorProfileModel.fromData({
        ...validInput,
        phone: '1234567890',
        phoneCountryCode: '+1',
        addresses: [],
        verificationStatus: VerificationStatus.Verified,
        stripeConnectId: 'acct_123',
        agreementAccepted: true,
        onboardingCompleted: true,
        metadata: { industry: 'food' },
        createdAt: now,
        updatedAt: now,
      });

      expect(vendor.stripeConnectId).toBe('acct_123');
      expect(vendor.onboardingCompleted).toBe(true);
    });
  });

  describe('mutations', () => {
    it('updateBusinessName returns new instance', () => {
      const vendor = VendorProfileModel.create(validInput);
      const updated = vendor.updateBusinessName('New Name');

      expect(updated.businessName).toBe('New Name');
      expect(vendor.businessName).toBe('Test Business');
      expect(updated).not.toBe(vendor);
    });

    it('completeOnboarding returns new instance', () => {
      const vendor = VendorProfileModel.create(validInput);
      const updated = vendor.completeOnboarding();

      expect(updated.onboardingCompleted).toBe(true);
      expect(vendor.onboardingCompleted).toBe(false);
    });

    it('acceptAgreement returns new instance', () => {
      const vendor = VendorProfileModel.create(validInput);
      const updated = vendor.acceptAgreement();
      expect(updated.agreementAccepted).toBe(true);
    });

    it('updateVerificationStatus returns new instance', () => {
      const vendor = VendorProfileModel.create(validInput);
      const updated = vendor.updateVerificationStatus(VerificationStatus.Verified);
      expect(updated.verificationStatus).toBe(VerificationStatus.Verified);
    });

    it('updateAddresses returns new instance', () => {
      const addresses = [
        {
          type: AddressType.Primary,
          address: {
            street: '123 Main St',
            city: 'Toronto',
            province: 'ON',
            country: 'CA',
            postalCode: 'M5V 1A1',
          },
        },
      ];
      const vendor = VendorProfileModel.create(validInput);
      const updated = vendor.updateAddresses(addresses);

      expect(updated.addresses).toHaveLength(1);
      expect(vendor.addresses).toHaveLength(0);
    });
  });
});
