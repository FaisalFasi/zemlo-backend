import { runAdminCommand } from './commands/admin.command';
import { runVerifyCommand } from './commands/verify.command';

function printHelp(): void {
  console.log(`
Zemlo Backend CLI

Usage:
  npm run zemlo -- <command>

Commands:
  help
      Show this help message.

  verify quick
      Run fast local verification:
      lint + build

  verify full
      Run complete backend verification:
      lint + build + contracts + OpenAPI + inventory audit

  admin create
      Create a verified SUPER_ADMIN account.
      Requires:
      ADMIN_EMAIL
      ADMIN_PASSWORD
      ADMIN_FIRST_NAME
      ADMIN_LAST_NAME

Examples:
  npm run zemlo -- verify quick
  npm run zemlo -- verify full
  npm run zemlo -- admin create
`);
}

async function main(): Promise<void> {
  const [command = 'help', ...args] = process.argv.slice(2);

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      return;

    case 'verify':
      await runVerifyCommand(args);
      return;

    case 'admin':
      await runAdminCommand(args);
      return;

    default:
      throw new Error(
        `Unknown command "${command}". Run "npm run zemlo -- help".`,
      );
  }
}

main().catch((error: unknown) => {
  console.error(
    `\n❌ ${
      error instanceof Error ? error.message : 'Unknown Zemlo CLI error'
    }\n`,
  );

  process.exitCode = 1;
});
