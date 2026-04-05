import { Inject, Injectable } from '@nestjs/common';
import type { VendorProfileRepository } from '@ecomsaas/application/ports';
import {
  InvariantError,
  NotFoundError,
  VendorProfileModel,
  err,
  ok,
  type Result,
} from '@ecomsaas/domain';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import { SUPABASE_CLIENT } from '../../database';
import { asRecord } from '../../common/database';

type VendorProfileRow = {
  id: string;
  user_id: string;
  business_name: string;
  phone: string | null;
  phone_country_code: string | null;
  addresses: unknown;
  verification_status: string;
  stripe_connect_id: string | null;
  agreement_accepted: boolean;
  onboarding_completed: boolean;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class SupabaseVendorProfileRepository implements VendorProfileRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Result<VendorProfileModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('vendor_profiles')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle<VendorProfileRow>();

    if (error) {
      throw new InvariantError(`Failed to query vendor profile by id`, { cause: error.message });
    }

    if (!data) {
      return err(new NotFoundError('VendorProfile', id));
    }

    return ok(this.toVendorProfileModel(data));
  }

  async findByUserId(userId: string): Promise<Result<VendorProfileModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle<VendorProfileRow>();

    if (error) {
      throw new InvariantError(`Failed to query vendor profile by user id`, {
        cause: error.message,
      });
    }

    if (!data) {
      return err(new NotFoundError('VendorProfile', userId));
    }

    return ok(this.toVendorProfileModel(data));
  }

  async save(profile: VendorProfileModel): Promise<Result<VendorProfileModel, Error>> {
    const payload = {
      id: profile.id,
      user_id: profile.userId,
      business_name: profile.businessName,
      phone: profile.phone ?? null,
      phone_country_code: profile.phoneCountryCode ?? null,
      addresses: profile.addresses,
      verification_status: profile.verificationStatus,
      stripe_connect_id: profile.stripeConnectId ?? null,
      agreement_accepted: profile.agreementAccepted,
      onboarding_completed: profile.onboardingCompleted,
      metadata: profile.metadata,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    };

    const { data, error } = await this.supabase
      .from('vendor_profiles')
      .upsert(payload)
      .select('*')
      .limit(1)
      .single<VendorProfileRow>();

    if (error) {
      return err(new InvariantError(`Failed to save vendor profile`, { cause: error.message }));
    }

    return ok(this.toVendorProfileModel(data));
  }

  private toVendorProfileModel(row: VendorProfileRow): VendorProfileModel {
    return VendorProfileModel.fromData({
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      phone: row.phone ?? undefined,
      phoneCountryCode: row.phone_country_code ?? undefined,
      addresses: Array.isArray(row.addresses)
        ? (row.addresses as VendorProfileModel['addresses'])
        : [],
      verificationStatus: row.verification_status as VendorProfileModel['verificationStatus'],
      stripeConnectId: row.stripe_connect_id ?? undefined,
      agreementAccepted: row.agreement_accepted,
      onboardingCompleted: row.onboarding_completed,
      metadata: asRecord(row.metadata),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
