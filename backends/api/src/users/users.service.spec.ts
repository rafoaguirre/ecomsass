import type { GetUser, UpdateUser } from '@ecomsaas/application/use-cases';
import {
  AccountStatus,
  AccountTier,
  NotFoundError,
  UserAccountModel,
  UserRole,
  ValidationError,
  VerificationStatus,
  err,
  ok,
} from '@ecomsaas/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const baseUser = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    defaultLocale: 'en',
    accountTier: AccountTier.GeneralUser,
    accountStatus: AccountStatus.Active,
    role: UserRole.Customer,
    stripeCustomerId: null,
    marketingConsent: false,
    agreementAccepted: false,
    verificationStatus: VerificationStatus.Unverified,
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
    },
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let service: UsersService;
  let getUser: GetUser;
  let updateUser: UpdateUser;

  beforeEach(() => {
    getUser = { execute: vi.fn() } as unknown as GetUser;
    updateUser = { execute: vi.fn() } as unknown as UpdateUser;
    service = new UsersService(getUser, updateUser);
  });

  it('returns user profile by id', async () => {
    const user = UserAccountModel.fromData(baseUser);
    vi.mocked(getUser.execute).mockResolvedValue(ok(user));

    const result = await service.getById('user-1');

    expect(result.id).toBe('user-1');
    expect(result.email).toBe('test@example.com');
    expect(result.fullName).toBe('Test User');
    expect(getUser.execute).toHaveBeenCalledWith({
      identifier: 'user-1',
      identifierType: 'id',
    });
  });

  it('throws NotFoundError when user does not exist', async () => {
    vi.mocked(getUser.execute).mockResolvedValue(err(new NotFoundError('User', 'missing-id')));

    await expect(service.getById('missing-id')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates user profile', async () => {
    const updated = UserAccountModel.fromData({ ...baseUser, fullName: 'Updated Name' });
    vi.mocked(updateUser.execute).mockResolvedValue(ok(updated));

    const result = await service.update({ id: 'user-1', fullName: 'Updated Name' });

    expect(result.fullName).toBe('Updated Name');
    expect(updateUser.execute).toHaveBeenCalledWith({
      id: 'user-1',
      fullName: 'Updated Name',
    });
  });

  it('throws ValidationError on update failure', async () => {
    vi.mocked(updateUser.execute).mockResolvedValue(err(new ValidationError('Save failed')));

    await expect(service.update({ id: 'user-1', fullName: '' })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it('updates user preferences', async () => {
    const updated = UserAccountModel.fromData({
      ...baseUser,
      preferences: { emailNotifications: false, smsNotifications: true, marketingEmails: false },
    });
    vi.mocked(updateUser.execute).mockResolvedValue(ok(updated));

    const result = await service.update({
      id: 'user-1',
      preferences: { emailNotifications: false, smsNotifications: true },
    });

    expect(result.preferences.emailNotifications).toBe(false);
    expect(result.preferences.smsNotifications).toBe(true);
  });
});
