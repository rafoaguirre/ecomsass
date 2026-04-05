import { Inject, Injectable } from '@nestjs/common';
import type { StoreRepository } from '@ecomsaas/application/ports';
import { InvariantError, NotFoundError, StoreModel, err, ok, type Result } from '@ecomsaas/domain';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import { SUPABASE_CLIENT } from '../../database';
import { asRecord } from '../../common/database';

type StoreRow = {
  id: string;
  vendor_profile_id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone_number: string | null;
  phone_country_code: string | null;
  address: unknown;
  slug: string;
  store_type: string;
  is_active: boolean;
  operating_hours: unknown;
  metadata: unknown;
  created_at: string;
  updated_at: string;
  vendor_profiles?: { business_name: string | null } | { business_name: string | null }[] | null;
};

function asOperatingHours(value: unknown): StoreModel['operatingHours'] {
  return Array.isArray(value) ? (value as StoreModel['operatingHours']) : undefined;
}

function getVendorName(
  vendorProfiles:
    | { business_name: string | null }
    | { business_name: string | null }[]
    | null
    | undefined
): string | undefined {
  if (!vendorProfiles) {
    return undefined;
  }

  if (Array.isArray(vendorProfiles)) {
    return vendorProfiles[0]?.business_name ?? undefined;
  }

  return vendorProfiles.business_name ?? undefined;
}

@Injectable()
export class SupabaseStoreRepository implements StoreRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Result<StoreModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*, vendor_profiles!inner(business_name)')
      .eq('id', id)
      .limit(1)
      .maybeSingle<StoreRow>();

    if (error) {
      throw new InvariantError(`Failed to query store by id`, { cause: error.message });
    }

    if (!data) {
      return err(new NotFoundError('Store', id));
    }

    return ok(this.toStoreModel(data));
  }

  async findBySlug(slug: string): Promise<Result<StoreModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*, vendor_profiles!inner(business_name)')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle<StoreRow>();

    if (error) {
      throw new InvariantError(`Failed to query store by slug`, { cause: error.message });
    }

    if (!data) {
      return err(new NotFoundError('Store', slug));
    }

    return ok(this.toStoreModel(data));
  }

  async findByVendorId(vendorProfileId: string): Promise<StoreModel[]> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*, vendor_profiles!inner(business_name)')
      .eq('vendor_profile_id', vendorProfileId)
      .order('created_at', { ascending: false })
      .returns<StoreRow[]>();

    if (error) {
      throw new InvariantError(`Failed to list stores by vendor id`, { cause: error.message });
    }

    return (data ?? []).map((row) => this.toStoreModel(row));
  }

  async findActive(): Promise<StoreModel[]> {
    const { data, error } = await this.supabase
      .from('stores')
      .select('*, vendor_profiles!inner(business_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .returns<StoreRow[]>();

    if (error) {
      throw new InvariantError(`Failed to list active stores`, { cause: error.message });
    }

    return (data ?? []).map((row) => this.toStoreModel(row));
  }

  async save(store: StoreModel): Promise<Result<StoreModel, Error>> {
    const payload = {
      id: store.id,
      vendor_profile_id: store.vendorProfileId,
      name: store.name,
      description: store.description ?? null,
      email: store.email ?? null,
      phone_number: store.phoneNumber ?? null,
      phone_country_code: store.phoneCountryCode ?? null,
      address: store.address,
      slug: store.slug,
      store_type: store.storeType,
      is_active: store.isActive,
      operating_hours: store.operatingHours ?? null,
      metadata: store.metadata,
      created_at: store.createdAt.toISOString(),
      updated_at: store.updatedAt.toISOString(),
    };

    const { data, error } = await this.supabase
      .from('stores')
      .upsert(payload)
      .select('*, vendor_profiles!inner(business_name)')
      .limit(1)
      .single<StoreRow>();

    if (error) {
      return err(new InvariantError(`Failed to save store`, { cause: error.message }));
    }

    return ok(this.toStoreModel(data));
  }

  async delete(id: string): Promise<Result<void, Error>> {
    const { error } = await this.supabase.from('stores').update({ is_active: false }).eq('id', id);

    if (error) {
      return err(new InvariantError(`Failed to delete store`, { cause: error.message }));
    }

    return ok(undefined);
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase.from('stores').select('id').eq('slug', slug).limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.returns<{ id: string }[]>();

    if (error) {
      throw new InvariantError(`Failed to check store slug uniqueness`, { cause: error.message });
    }

    return (data ?? []).length > 0;
  }

  private toStoreModel(row: StoreRow): StoreModel {
    const metadata = asRecord(row.metadata);
    const vendorName = getVendorName(row.vendor_profiles);

    return StoreModel.fromData({
      id: row.id,
      vendorProfileId: row.vendor_profile_id,
      name: row.name,
      description: row.description ?? undefined,
      email: row.email ?? undefined,
      phoneNumber: row.phone_number ?? undefined,
      phoneCountryCode: row.phone_country_code ?? undefined,
      address: asRecord(row.address) as unknown as StoreModel['address'],
      slug: row.slug,
      storeType: row.store_type as StoreModel['storeType'],
      isActive: row.is_active,
      operatingHours: asOperatingHours(row.operating_hours),
      metadata: vendorName ? { ...metadata, vendorName } : metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
