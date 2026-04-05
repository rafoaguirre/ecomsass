import type { UserAccountModel, Result, NotFoundError } from '@ecomsaas/domain';
import type { UserRepository } from '../../ports';

export interface GetUserInput {
  identifier: string;
  identifierType?: 'id' | 'email';
}

export class GetUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetUserInput): Promise<Result<UserAccountModel, NotFoundError>> {
    const { identifier, identifierType = 'id' } = input;

    if (identifierType === 'email') {
      return this.userRepository.findByEmail(identifier);
    }

    return this.userRepository.findById(identifier);
  }
}
