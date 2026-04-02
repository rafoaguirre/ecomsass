import { Inject, Injectable } from '@nestjs/common';
import type { ProductRepository } from '@ecomsaas/application/ports';
import { NotFoundError, ProductModel, err, ok, type Result } from '@ecomsaas/domain';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import { SUPABASE_CLIENT } from '../../database';
import { applyPagination, asRecord, type PaginationOptions } from '../../common/database';

type ProductRow = {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: unknown;
  compare_at_price: unknown | null;
  images: unknown;
  category_id: string | null;
  supplier_id: string | null;
  availability: string;
  inventory: unknown | null;
  variants: unknown | null;
  tags: string[];
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class SupabaseProductRepository implements ProductRepository {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Result<ProductModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle<ProductRow>();

    if (error) {
      throw new Error(`Failed to query product by id: ${error.message}`);
    }

    if (!data) {
      return err(new NotFoundError('Product', id));
    }

    return ok(this.toProductModel(data));
  }

  async findBySlug(storeId: string, slug: string): Promise<Result<ProductModel, NotFoundError>> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .limit(1)
      .maybeSingle<ProductRow>();

    if (error) {
      throw new Error(`Failed to query product by slug: ${error.message}`);
    }

    if (!data) {
      return err(new NotFoundError('Product', slug));
    }

    return ok(this.toProductModel(data));
  }

  async findByStoreId(
    storeId: string,
    options?: PaginationOptions & { categoryId?: string }
  ): Promise<ProductModel[]> {
    let query = this.supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options) {
      ({ query } = applyPagination(query, options));
    }

    const { data, error } = await query.returns<ProductRow[]>();

    if (error) {
      throw new Error(`Failed to list products by store: ${error.message}`);
    }

    return (data ?? []).map((row) => this.toProductModel(row));
  }

  async findByCategoryId(categoryId: string, options?: PaginationOptions): Promise<ProductModel[]> {
    let query = this.supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (options) {
      ({ query } = applyPagination(query, options));
    }

    const { data, error } = await query.returns<ProductRow[]>();

    if (error) {
      throw new Error(`Failed to list products by category: ${error.message}`);
    }

    return (data ?? []).map((row) => this.toProductModel(row));
  }

  async save(product: ProductModel): Promise<Result<ProductModel, Error>> {
    const payload = {
      id: product.id,
      store_id: product.storeId,
      name: product.name,
      slug: product.slug,
      description: product.description ?? null,
      price: product.price,
      compare_at_price: product.compareAtPrice ?? null,
      images: product.images,
      category_id: product.categoryId ?? null,
      supplier_id: product.supplierId ?? null,
      availability: product.availability,
      inventory: product.inventory ?? null,
      variants: product.variants ?? null,
      tags: product.tags,
      metadata: product.metadata,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };

    const { data, error } = await this.supabase
      .from('products')
      .upsert(payload)
      .select('*')
      .limit(1)
      .single<ProductRow>();

    if (error) {
      return err(new Error(`Failed to save product: ${error.message}`));
    }

    return ok(this.toProductModel(data));
  }

  async delete(id: string): Promise<Result<void, Error>> {
    const { error } = await this.supabase.from('products').delete().eq('id', id);

    if (error) {
      return err(new Error(`Failed to delete product: ${error.message}`));
    }

    return ok(undefined);
  }

  async slugExists(storeId: string, slug: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.returns<{ id: string }[]>();

    if (error) {
      throw new Error(`Failed to check product slug uniqueness: ${error.message}`);
    }

    return (data ?? []).length > 0;
  }

  private toProductModel(row: ProductRow): ProductModel {
    return ProductModel.fromData({
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? undefined,
      price: row.price as ProductModel['price'],
      compareAtPrice: row.compare_at_price as ProductModel['compareAtPrice'],
      images: Array.isArray(row.images) ? (row.images as ProductModel['images']) : [],
      categoryId: row.category_id ?? undefined,
      supplierId: row.supplier_id ?? undefined,
      availability: row.availability as ProductModel['availability'],
      inventory: row.inventory as ProductModel['inventory'],
      variants: Array.isArray(row.variants)
        ? (row.variants as ProductModel['variants'])
        : undefined,
      tags: row.tags ?? [],
      metadata: asRecord(row.metadata),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
