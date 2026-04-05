import type { NotFoundError } from '@ecomsaas/domain';
import { UserAccountModel, ValidationError, type Result, ok, err } from '@ecomsaas/domain';
import type { UserRepository } from '../../ports';

export interface UpdateUserInput {
  id: string;
  fullName?: string;
  defaultLocale?: string;
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export class UpdateUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    input: UpdateUserInput
  ): Promise<Result<UserAccountModel, NotFoundError | ValidationError>> {
    const findResult = await this.userRepository.findById(input.id);

    if (findResult.isErr()) {
      return err(findResult.error);
    }

    let user = findResult.value;

    if (input.fullName !== undefined) {
      user = user.updateFullName(input.fullName);
    }

    if (input.preferences !== undefined) {
      user = user.updatePreferences(input.preferences);
    }

    // Fields without dedicated domain methods — apply via fromData rebuild
    const needsRebuild = input.defaultLocale !== undefined || input.metadata !== undefined;

    if (needsRebuild) {
      user = UserAccountModel.fromData({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        defaultLocale: input.defaultLocale ?? user.defaultLocale,
        accountTier: user.accountTier,
        accountStatus: user.accountStatus,
        role: user.role,
        stripeCustomerId: user.stripeCustomerId,
        marketingConsent: user.marketingConsent,
        agreementAccepted: user.agreementAccepted,
        verificationStatus: user.verificationStatus,
        preferences: user.preferences,
        metadata: input.metadata ?? user.metadata,
        createdAt: user.createdAt,
        updatedAt: new Date(),
      });
    }

    const saveResult = await this.userRepository.save(user);

    if (saveResult.isErr()) {
      return err(new ValidationError(saveResult.error.message));
    }

    return ok(saveResult.value);
  }
}
