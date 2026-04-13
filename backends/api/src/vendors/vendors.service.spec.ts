import type {
  GetVendorProfile,
  CreateVendorProfile,
  UpdateVendorProfile,
} from '@ecomsaas/application/use-cases';
import type { VendorProfileRepository } from '@ecomsaas/application/ports';
import {
  NotFoundError,
  ValidationError,
  VendorProfileModel,
  VerificationStatus,
  err,
  ok,
} from '@ecomsaas/domain';
import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorsService } from './vendors.service';

describe('VendorsService', () => {
  const baseProfile = {
    id: 'vendor-1',
    userId: 'user-1',
    businessName: 'Test Business',
    phone: undefined,
    phoneCountryCode: undefined,
    addresses: [],
    verificationStatus: VerificationStatus.Unverified,
    stripeConnectId: undefined,
    agreementAccepted: false,
    onboardingCompleted: false,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let service: VendorsService;
  let getVendorProfile: GetVendorProfile;
  let createVendorProfile: CreateVendorProfile;
  let updateVendorProfile: UpdateVendorProfile;
  let vendorProfileRepository: VendorProfileRepository;
  const ownerUser = { id: 'user-1', email: 'v@test.com', role: 'Vendor' };
  const adminUser = { id: 'admin-1', email: 'a@test.com', role: 'Admin' };
  const otherUser = { id: 'user-2', email: 'other@test.com', role: 'Vendor' };

  beforeEach(() => {
    getVendorProfile = { execute: vi.fn() } as unknown as GetVendorProfile;
    createVendorProfile = { execute: vi.fn() } as unknown as CreateVendorProfile;
    updateVendorProfile = { execute: vi.fn() } as unknown as UpdateVendorProfile;
    vendorProfileRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
    } as unknown as VendorProfileRepository;
    service = new VendorsService(
      getVendorProfile,
      createVendorProfile,
      updateVendorProfile,
      vendorProfileRepository
    );
  });

  it('creates a vendor profile', async () => {
    const profile = VendorProfileModel.fromData(baseProfile);
    vi.mocked(createVendorProfile.execute).mockResolvedValue(ok(profile));

    const result = await service.create({
      userId: 'user-1',
      businessName: 'Test Business',
    });

    expect(result.businessName).toBe('Test Business');
    expect(createVendorProfile.execute).toHaveBeenCalled();
  });

  it('throws ValidationError when user already has vendor profile', async () => {
    vi.mocked(createVendorProfile.execute).mockResolvedValue(
      err(new ValidationError('User already has a vendor profile'))
    );

    await expect(
      service.create({ userId: 'user-1', businessName: 'Duplicate' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('gets vendor profile by id for owner', async () => {
    const profile = VendorProfileModel.fromData(baseProfile);
    vi.mocked(getVendorProfile.execute).mockResolvedValue(ok(profile));

    const result = await service.getById('vendor-1', ownerUser);

    expect(result.id).toBe('vendor-1');
    expect(getVendorProfile.execute).toHaveBeenCalledWith({
      identifier: 'vendor-1',
      identifierType: 'id',
    });
  });

  it('allows Admin to get any vendor profile by id', async () => {
    const profile = VendorProfileModel.fromData(baseProfile);
    vi.mocked(getVendorProfile.execute).mockResolvedValue(ok(profile));

    const result = await service.getById('vendor-1', adminUser);

    expect(result.id).toBe('vendor-1');
  });

  it('throws ForbiddenException when non-owner reads vendor profile by id', async () => {
    const profile = VendorProfileModel.fromData(baseProfile);
    vi.mocked(getVendorProfile.execute).mockResolvedValue(ok(profile));

    await expect(service.getById('vendor-1', otherUser)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('gets vendor profile by user id', async () => {
    const profile = VendorProfileModel.fromData(baseProfile);
    vi.mocked(getVendorProfile.execute).mockResolvedValue(ok(profile));

    const result = await service.getByUserId('user-1');

    expect(result.userId).toBe('user-1');
    expect(getVendorProfile.execute).toHaveBeenCalledWith({
      identifier: 'user-1',
      identifierType: 'userId',
    });
  });

  it('throws NotFoundError when vendor profile does not exist', async () => {
    vi.mocked(getVendorProfile.execute).mockResolvedValue(
      err(new NotFoundError('VendorProfile', 'missing'))
    );

    await expect(service.getById('missing', ownerUser)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates vendor profile for owner', async () => {
    const profile = VendorProfileModel.fromData(baseProfile);
    vi.mocked(getVendorProfile.execute).mockResolvedValue(ok(profile));
    const updated = VendorProfileModel.fromData({
      ...baseProfile,
      businessName: 'Updated',
    });
    vi.mocked(updateVendorProfile.execute).mockResolvedValue(ok(updated));

    const result = await service.update({ id: 'vendor-1', businessName: 'Updated' }, ownerUser);

    expect(result.businessName).toBe('Updated');
  });

  it('allows Admin to update any vendor profile', async () => {
    const updated = VendorProfileModel.fromData({
      ...baseProfile,
      businessName: 'Admin Updated',
    });
    vi.mocked(updateVendorProfile.execute).mockResolvedValue(ok(updated));

    const result = await service.update(
      { id: 'vendor-1', businessName: 'Admin Updated' },
      adminUser
    );

    expect(result.businessName).toBe('Admin Updated');
    // Admin bypasses ownership so getVendorProfile should not have been called for ownership
  });

  it('throws ForbiddenException when non-owner updates vendor profile', async () => {
    const profile = VendorProfileModel.fromData(baseProfile);
    vi.mocked(getVendorProfile.execute).mockResolvedValue(ok(profile));

    await expect(
      service.update({ id: 'vendor-1', businessName: 'Hacked' }, otherUser)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundError on update when profile does not exist', async () => {
    vi.mocked(getVendorProfile.execute).mockResolvedValue(
      err(new NotFoundError('VendorProfile', 'vendor-1'))
    );

    await expect(
      service.update({ id: 'vendor-1', businessName: 'Nope' }, ownerUser)
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
