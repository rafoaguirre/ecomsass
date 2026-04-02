import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '@ecomsaas/application/ports';
import { NotFoundError, UserAccountModel, err, ok, type Result } from '@ecomsaas/domain';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import { SUPABASE_CLIENT } from '../../database';
import { asRecord } from '../../common/database';

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  default_locale: string;
  account_tier: string;
  account_status: string;
  role: string;
  stripe_customer_id: string | null;
  marketing_consent: boolean;
  agreement_accepted: boolean;
  verification_status: string;
  preferences: unknown;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class SupabaseUserRepository implements UserRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Result<UserAccountModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle<ProfileRow>();

    if (error) {
      throw new Error(`Failed to query profile by id: ${error.message}`);
    }

    if (!data) {
      return err(new NotFoundError('User', id));
    }

    return ok(this.toUserAccountModel(data));
  }

  async findByEmail(email: string): Promise<Result<UserAccountModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .limit(1)
      .maybeSingle<ProfileRow>();

    if (error) {
      throw new Error(`Failed to query profile by email: ${error.message}`);
    }

    if (!data) {
      return err(new NotFoundError('User', email));
    }

    return ok(this.toUserAccountModel(data));
  }

  async save(user: UserAccountModel): Promise<Result<UserAccountModel, Error>> {
    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      default_locale: user.defaultLocale,
      account_tier: user.accountTier,
      account_status: user.accountStatus,
      role: user.role,
      stripe_customer_id: user.stripeCustomerId,
      marketing_consent: user.marketingConsent,
      agreement_accepted: user.agreementAccepted,
      verification_status: user.verificationStatus,
      preferences: user.preferences,
      metadata: user.metadata,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };

    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(payload)
      .select('*')
      .limit(1)
      .single<ProfileRow>();

    if (error) {
      return err(new Error(`Failed to save profile: ${error.message}`));
    }

    return ok(this.toUserAccountModel(data));
  }

  private toUserAccountModel(row: ProfileRow): UserAccountModel {
    const preferences = asRecord(row.preferences);

    return UserAccountModel.fromData({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      defaultLocale: row.default_locale,
      accountTier: row.account_tier as UserAccountModel['accountTier'],
      accountStatus: row.account_status as UserAccountModel['accountStatus'],
      role: row.role as UserAccountModel['role'],
      stripeCustomerId: row.stripe_customer_id,
      marketingConsent: row.marketing_consent,
      agreementAccepted: row.agreement_accepted,
      verificationStatus: row.verification_status as UserAccountModel['verificationStatus'],
      preferences: {
        emailNotifications: (preferences.emailNotifications as boolean) ?? true,
        smsNotifications: (preferences.smsNotifications as boolean) ?? false,
        marketingEmails: (preferences.marketingEmails as boolean) ?? false,
      },
      metadata: asRecord(row.metadata),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
