import { Inject, Injectable } from '@nestjs/common';
import { GetUser, UpdateUser, type UpdateUserInput } from '@ecomsaas/application/use-cases';
import type { UserResponse } from '@ecomsaas/contracts';
import { toUserResponse } from './dto/user.mapper';

@Injectable()
export class UsersService {
  constructor(
    @Inject(GetUser) private readonly getUser: GetUser,
    @Inject(UpdateUser) private readonly updateUser: UpdateUser
  ) {}

  async getById(id: string): Promise<UserResponse> {
    const result = await this.getUser.execute({ identifier: id, identifierType: 'id' });

    if (result.isErr()) {
      throw result.error;
    }

    return toUserResponse(result.value);
  }

  async update(input: UpdateUserInput): Promise<UserResponse> {
    const result = await this.updateUser.execute(input);

    if (result.isErr()) {
      throw result.error;
    }

    return toUserResponse(result.value);
  }
}
