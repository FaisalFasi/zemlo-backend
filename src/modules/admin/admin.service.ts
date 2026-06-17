import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { hashPassword } from '../../common/utils/hash.util';
import { PrismaService } from '../../prisma/prisma.service';

export type BootstrapSuperAdminInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type BootstrapSuperAdminOptions = {
  dryRun?: boolean;
};

type BootstrapSuperAdminResult = {
  created: boolean;
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    createdAt: Date;
  } | null;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrapSuperAdmin(
    input: BootstrapSuperAdminInput,
    options: BootstrapSuperAdminOptions = {},
  ): Promise<BootstrapSuperAdminResult> {
    const normalizedInput = this.normalizeInput(input);

    this.validateInput(normalizedInput);

    if (options.dryRun) {
      await this.assertBootstrapAllowed(this.prisma, normalizedInput.email);

      return {
        created: false,
        admin: null,
      };
    }

    const hashedPassword = await hashPassword(normalizedInput.password);

    return this.prisma.$transaction(
      async (tx) => {
        await this.assertBootstrapAllowed(tx, normalizedInput.email);

        const admin = await tx.user.create({
          data: {
            email: normalizedInput.email,
            password: hashedPassword,
            firstName: normalizedInput.firstName,
            lastName: normalizedInput.lastName,
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            isVerified: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
          },
        });

        return {
          created: true,
          admin,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  private async assertBootstrapAllowed(
    database: Pick<PrismaService, 'user'>,
    email: string,
  ): Promise<void> {
    const existingSuperAdmin = await database.user.findFirst({
      where: {
        role: UserRole.SUPER_ADMIN,
      },
      select: {
        id: true,
      },
    });

    if (existingSuperAdmin) {
      throw new Error(
        'A SUPER_ADMIN account already exists. Bootstrap was refused.',
      );
    }

    const existingUser = await database.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (existingUser) {
      throw new Error(
        `A user with email "${email}" already exists with role ${existingUser.role}. Existing users are never promoted automatically.`,
      );
    }
  }

  private normalizeInput(
    input: BootstrapSuperAdminInput,
  ): BootstrapSuperAdminInput {
    return {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
    };
  }

  private validateInput(input: BootstrapSuperAdminInput): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(input.email)) {
      throw new Error('ADMIN_EMAIL must be a valid email address.');
    }

    if (!input.firstName || !input.lastName) {
      throw new Error('ADMIN_FIRST_NAME and ADMIN_LAST_NAME are required.');
    }

    if (input.password.length < 12) {
      throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
    }

    const hasLowercase = /[a-z]/.test(input.password);
    const hasUppercase = /[A-Z]/.test(input.password);
    const hasNumber = /\d/.test(input.password);
    const hasSpecialCharacter = /[^a-zA-Z0-9]/.test(input.password);

    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecialCharacter) {
      throw new Error(
        'ADMIN_PASSWORD must contain uppercase, lowercase, number, and special character.',
      );
    }
  }
}
