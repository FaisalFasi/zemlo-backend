import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { AdminModule } from '../modules/admin/admin.module';
import { AdminService } from '../modules/admin/admin.service';

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }

  return value;
}

function printUsage(): void {
  console.log(`
Usage:
  npm run admin -- bootstrap
  npm run admin -- bootstrap --dry-run

Required environment variables:
  ADMIN_EMAIL
  ADMIN_PASSWORD
  ADMIN_FIRST_NAME
  ADMIN_LAST_NAME
`);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (command !== 'bootstrap') {
    throw new Error(
      `Unknown admin command "${command}". Supported command: bootstrap`,
    );
  }

  const dryRun = args.includes('--dry-run');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const adminService = app
      .select(AdminModule)
      .get(AdminService, { strict: true });

    const result = await adminService.bootstrapSuperAdmin(
      {
        email: getRequiredEnvironmentVariable('ADMIN_EMAIL'),
        password: getRequiredEnvironmentVariable('ADMIN_PASSWORD'),
        firstName: getRequiredEnvironmentVariable('ADMIN_FIRST_NAME'),
        lastName: getRequiredEnvironmentVariable('ADMIN_LAST_NAME'),
      },
      {
        dryRun,
      },
    );

    if (dryRun) {
      console.log(
        '✅ SUPER_ADMIN bootstrap validation passed. No database changes were made.',
      );
      return;
    }

    console.log('✅ SUPER_ADMIN created successfully:');
    console.log(result.admin);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    `❌ ${
      error instanceof Error ? error.message : 'Unknown admin bootstrap error'
    }`,
  );

  process.exitCode = 1;
});
