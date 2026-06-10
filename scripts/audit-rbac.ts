import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  PERMISSIONS,
  type PermissionName,
} from '../src/common/constants/permissions';
import { permissionsData } from '../prisma/seeds/permissions.seed';
import { rolePermissionsMap } from '../prisma/seeds/role-permissions.seed';

const rootDir = process.cwd();
const srcDir = join(rootDir, 'src');

const permissionConstants = Object.values(PERMISSIONS);
const permissionConstantKeys = Object.keys(PERMISSIONS);
const seededPermissionNames = permissionsData.map(
  (permission) => permission.name,
);

const failures: string[] = [];

function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}

function walkTsFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return walkTsFiles(fullPath);
    }

    if (!fullPath.endsWith('.ts') || fullPath.endsWith('.spec.ts')) {
      return [];
    }

    return [fullPath];
  });
}

function assertNoMissingSeedPermissions() {
  const missingFromSeed = permissionConstants.filter(
    (permission) => !seededPermissionNames.includes(permission),
  );

  const unknownSeedPermissions = seededPermissionNames.filter(
    (permission) => !permissionConstants.includes(permission),
  );

  if (missingFromSeed.length > 0) {
    failures.push(
      `Permissions missing from prisma/seeds/permissions.seed.ts: ${missingFromSeed.join(
        ', ',
      )}`,
    );
  }

  if (unknownSeedPermissions.length > 0) {
    failures.push(
      `Seed contains permissions not defined in PERMISSIONS: ${unknownSeedPermissions.join(
        ', ',
      )}`,
    );
  }

  const duplicateSeedPermissions = seededPermissionNames.filter(
    (permission, index) => seededPermissionNames.indexOf(permission) !== index,
  );

  if (duplicateSeedPermissions.length > 0) {
    failures.push(
      `Duplicate seeded permissions found: ${unique(
        duplicateSeedPermissions,
      ).join(', ')}`,
    );
  }
}

function assertValidRolePermissions() {
  const knownPermissions = new Set(permissionConstants);

  for (const [role, permissions] of Object.entries(rolePermissionsMap)) {
    const unknownPermissions = permissions.filter(
      (permission) => !knownPermissions.has(permission),
    );

    if (unknownPermissions.length > 0) {
      failures.push(
        `${role} role contains unknown permissions: ${unknownPermissions.join(
          ', ',
        )}`,
      );
    }

    function findDuplicates<T>(items: readonly T[]): T[] {
      return items.filter((item, index) => items.indexOf(item) !== index);
    }

    // const rolePermissions: readonly PermissionName[] = permissions;

    // const duplicatePermissions = rolePermissions.filter(
    //   (permission, index) => rolePermissions.indexOf(permission) !== index,
    // );

    const duplicatePermissions = findDuplicates<PermissionName>(permissions);

    if (duplicatePermissions.length > 0) {
      failures.push(
        `${role} role contains duplicate permissions: ${unique(
          duplicatePermissions,
        ).join(', ')}`,
      );
    }
  }
}

function assertNoLegacyAdminGuardUsage() {
  const files = walkTsFiles(srcDir);

  for (const file of files) {
    const relativePath = relative(rootDir, file);

    if (relativePath === 'src/common/guards/admin.guard.ts') {
      continue;
    }

    const content = readFileSync(file, 'utf8');

    if (content.includes('AdminGuard')) {
      failures.push(`Legacy AdminGuard usage found in ${relativePath}`);
    }
  }
}

function assertRequirePermissionsUsesConstants() {
  const files = walkTsFiles(srcDir);
  const knownPermissionKeys = new Set(permissionConstantKeys);

  for (const file of files) {
    const relativePath = relative(rootDir, file);
    const content = readFileSync(file, 'utf8');

    const requirePermissionCalls = content.matchAll(
      /@RequirePermissions\(([\s\S]*?)\)/g,
    );

    for (const match of requirePermissionCalls) {
      const args = match[1] ?? '';

      const rawStringPermissions = args.match(/['"`][a-z]+\.[a-z_]+['"`]/g);

      if (rawStringPermissions) {
        failures.push(
          `${relativePath} uses raw string permissions: ${rawStringPermissions.join(
            ', ',
          )}`,
        );
      }

      const permissionRefs = [...args.matchAll(/PERMISSIONS\.([A-Z0-9_]+)/g)];

      for (const permissionRef of permissionRefs) {
        const permissionKey = permissionRef[1];

        if (!knownPermissionKeys.has(permissionKey)) {
          failures.push(
            `${relativePath} references unknown permission constant: PERMISSIONS.${permissionKey}`,
          );
        }
      }
    }
  }
}

assertNoMissingSeedPermissions();
assertValidRolePermissions();
assertNoLegacyAdminGuardUsage();
assertRequirePermissionsUsesConstants();

if (failures.length > 0) {
  console.error('❌ RBAC audit failed.');

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log('✅ RBAC audit passed.');
console.log(`   Permissions: ${permissionConstants.length}`);
console.log(`   Seeded permissions: ${seededPermissionNames.length}`);
console.log(`   Roles audited: ${Object.keys(rolePermissionsMap).length}`);
