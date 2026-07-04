import { spawnSync } from 'node:child_process';

interface VerificationStep {
  name: string;
  command: string;
  args: string[];
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tsxCommand = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';

const steps: VerificationStep[] = [
  {
    name: 'Build application',
    command: npmCommand,
    args: ['run', 'build'],
  },
  {
    name: 'Lint source code',
    command: npmCommand,
    args: ['run', 'lint'],
  },
  {
    name: 'Run unit tests',
    command: npmCommand,
    args: ['test', '--', '--runInBand'],
  },
  {
    name: 'Audit RBAC',
    command: tsxCommand,
    args: ['scripts/audit-rbac.ts'],
  },
  {
    name: 'Audit DTO contracts',
    command: tsxCommand,
    args: ['scripts/audit-dto-contract.ts'],
  },
  {
    name: 'Audit Swagger DTOs',
    command: process.execPath,
    args: ['scripts/audit-swagger-dtos.cjs'],
  },
  {
    name: 'Audit API contracts',
    command: process.execPath,
    args: ['scripts/audit-api-contracts.cjs'],
  },
  {
    name: 'Export OpenAPI document',
    command: tsxCommand,
    args: ['scripts/export-openapi.ts'],
  },
  {
    name: 'Audit OpenAPI quality',
    command: tsxCommand,
    args: ['scripts/audit-openapi-quality.ts'],
  },
  {
    name: 'Audit inventory lifecycle',
    command: tsxCommand,
    args: ['scripts/audit-inventory-lifecycle.ts'],
  },
];

for (const [index, step] of steps.entries()) {
  console.log(`\n[${index + 1}/${steps.length}] ${step.name}`);

  const result = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`\n❌ ${step.name} could not start.`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\n❌ ${step.name} failed.`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n✅ Backend verification passed.');
