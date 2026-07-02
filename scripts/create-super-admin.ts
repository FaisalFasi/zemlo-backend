import { NestFactory } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { AppModule } from '../src/app.module';
import { hashPassword } from '../src/common/utils/hash.util';
import { PrismaService } from '../src/prisma/prisma.service';

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function validateAdminPassword(password: string): void {
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters');
  }

  const strongPasswordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

  if (!strongPasswordPattern.test(password)) {
    throw new Error(
      'ADMIN_PASSWORD must contain uppercase, lowercase, number, and special character',
    );
  }
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const prisma = app.get(PrismaService);

  try {
    const email = getRequiredEnvironmentVariable('ADMIN_EMAIL').toLowerCase();

    const password = getRequiredEnvironmentVariable('ADMIN_PASSWORD');
    const firstName = getRequiredEnvironmentVariable('ADMIN_FIRST_NAME');
    const lastName = getRequiredEnvironmentVariable('ADMIN_LAST_NAME');

    validateAdminPassword(password);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
      },
    });

    if (existingUser) {
      throw new Error(
        `A user with email ${email} already exists. Existing users are not modified by this script.`,
      );
    }

    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
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
      },
    });

    console.log('Super admin created successfully:');
    console.log(admin);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Unknown admin creation error',
  );

  process.exit(1);
});
