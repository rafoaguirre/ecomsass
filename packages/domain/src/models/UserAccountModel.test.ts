import { describe, it, expect } from 'vitest';
import { UserAccountModel } from './UserAccountModel';
import { AccountTier, AccountStatus, UserRole, VerificationStatus } from '../enums';

describe('UserAccountModel', () => {
  const validInput = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: UserRole.Customer,
  };

  describe('create', () => {
    it('creates a model with defaults', () => {
      const user = UserAccountModel.create(validInput);

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.fullName).toBe('Test User');
      expect(user.role).toBe('Customer');
      expect(user.defaultLocale).toBe('en');
      expect(user.accountTier).toBe(AccountTier.GeneralUser);
      expect(user.accountStatus).toBe(AccountStatus.Active);
      expect(user.verificationStatus).toBe(VerificationStatus.Unverified);
      expect(user.stripeCustomerId).toBeNull();
      expect(user.marketingConsent).toBe(false);
      expect(user.agreementAccepted).toBe(false);
      expect(user.preferences).toEqual({
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
      });
    });

    it('throws on missing email', () => {
      expect(() => UserAccountModel.create({ ...validInput, email: '' })).toThrow(
        'User email is required'
      );
    });

    it('throws on invalid email format', () => {
      expect(() => UserAccountModel.create({ ...validInput, email: 'not-an-email' })).toThrow(
        'User email'
      );
    });

    it('throws on missing full name', () => {
      expect(() => UserAccountModel.create({ ...validInput, fullName: '' })).toThrow(
        'User full name is required'
      );
    });
  });

  describe('fromData', () => {
    it('reconstitutes from persisted data', () => {
      const now = new Date();
      const user = UserAccountModel.fromData({
        ...validInput,
        defaultLocale: 'fr',
        accountTier: AccountTier.BasicMerchant,
        accountStatus: AccountStatus.Active,
        verificationStatus: VerificationStatus.Verified,
        stripeCustomerId: 'cus_123',
        marketingConsent: true,
        agreementAccepted: true,
        preferences: {
          emailNotifications: false,
          smsNotifications: true,
          marketingEmails: true,
        },
        metadata: { key: 'value' },
        createdAt: now,
        updatedAt: now,
      });

      expect(user.id).toBe('user-1');
      expect(user.accountTier).toBe(AccountTier.BasicMerchant);
      expect(user.stripeCustomerId).toBe('cus_123');
    });
  });

  describe('mutations', () => {
    it('updateFullName returns new instance', () => {
      const user = UserAccountModel.create(validInput);
      const updated = user.updateFullName('New Name');

      expect(updated.fullName).toBe('New Name');
      expect(user.fullName).toBe('Test User');
      expect(updated).not.toBe(user);
    });

    it('updateRole returns new instance', () => {
      const user = UserAccountModel.create(validInput);
      const updated = user.updateRole(UserRole.Vendor);
      expect(updated.role).toBe(UserRole.Vendor);
    });

    it('updateAccountStatus returns new instance', () => {
      const user = UserAccountModel.create(validInput);
      const updated = user.updateAccountStatus(AccountStatus.Suspended);
      expect(updated.accountStatus).toBe(AccountStatus.Suspended);
    });

    it('updatePreferences merges with existing', () => {
      const user = UserAccountModel.create(validInput);
      const updated = user.updatePreferences({ smsNotifications: true });

      expect(updated.preferences).toEqual({
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false,
      });
    });
  });
});
