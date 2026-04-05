import { Module } from '@nestjs/common';
import { GetUser, UpdateUser } from '@ecomsaas/application/use-cases';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from './user.tokens';
import { SupabaseUserRepository } from './repositories/supabase-user.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    SupabaseUserRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: SupabaseUserRepository,
    },
    {
      provide: GetUser,
      useFactory: (repo: SupabaseUserRepository) => new GetUser(repo),
      inject: [SupabaseUserRepository],
    },
    {
      provide: UpdateUser,
      useFactory: (repo: SupabaseUserRepository) => new UpdateUser(repo),
      inject: [SupabaseUserRepository],
    },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
