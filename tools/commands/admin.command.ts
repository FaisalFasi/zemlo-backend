import { UserRole } from '@prisma/client';

import { hashPassword } from '../../src/common/utils/hash.util';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createToolAppContext } from '../shared/create-app-context';

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function validateEmail(email: string): void {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address');
  }
}

function validatePassword(password: string): void {
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters');
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialCharacter = /[^a-zA-Z0-9]/.test(password);

  if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecialCharacter) {
    throw new Error(
      'ADMIN_PASSWORD must contain uppercase, lowercase, number, and special character',
    );
  }
}

async function createSuperAdmin(): Promise<void> {
  const app = await createToolAppContext();
  const prisma = app.get(PrismaService);

  try {
    const email = getRequiredEnvironmentVariable('ADMIN_EMAIL').toLowerCase();

    const password = getRequiredEnvironmentVariable('ADMIN_PASSWORD');
    const firstName = getRequiredEnvironmentVariable('ADMIN_FIRST_NAME');
    const lastName = getRequiredEnvironmentVariable('ADMIN_LAST_NAME');

    validateEmail(email);
    validatePassword(password);

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (existingUser) {
      throw new Error(
        `User "${email}" already exists with role ${existingUser.role}. Existing users are not modified automatically.`,
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
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Super admin created successfully:\n');
    console.log(admin);
    console.log('');
  } finally {
    await app.close();
  }
}

export async function runAdminCommand(args: string[]): Promise<void> {
  const action = args[0];

  if (action === 'create') {
    await createSuperAdmin();
    return;
  }

  throw new Error('Unknown admin command. Available command: admin create');
}
