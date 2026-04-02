import type { UserAccountModel, Result, NotFoundError } from '@ecomsaas/domain';

export interface UserRepository {
  findById(id: string): Promise<Result<UserAccountModel, NotFoundError>>;

  findByEmail(email: string): Promise<Result<UserAccountModel, NotFoundError>>;

  save(user: UserAccountModel): Promise<Result<UserAccountModel, Error>>;
}
