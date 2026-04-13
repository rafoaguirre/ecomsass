export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
  /** Cached vendor profile ID — resolved on first ownership check. */
  vendorProfileId?: string;
}
