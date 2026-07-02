const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');

const HTTP_DECORATORS = ['@Get', '@Post', '@Patch', '@Put', '@Delete'];

const RESPONSE_DECORATORS = [
  '@ApiOkResponse',
  '@ApiCreatedResponse',
  '@ApiAcceptedResponse',
  '@ApiNoContentResponse',
  '@ApiResponse',
];

const IGNORED_FILES = new Set(['src/app.controller.ts']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
      return [fullPath];
    }

    return [];
  });
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function isMethodSignature(line) {
  const trimmed = line.trim();

  return (
    !trimmed.startsWith('@') && trimmed.includes('(') && trimmed.endsWith('{')
  );
}

function getRouteDecoratorBlock(content, routeIndex) {
  const lines = content.split('\n');
  const routeLine = getLineNumber(content, routeIndex) - 1;
  const block = [];

  for (let i = routeLine; i < lines.length; i += 1) {
    const line = lines[i];

    if (isMethodSignature(line)) {
      break;
    }

    block.push(line);
  }

  return block.join('\n');
}

function auditController(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  if (IGNORED_FILES.has(relativePath)) {
    return {
      file: relativePath,
      issues: [],
    };
  }

  const issues = [];

  if (content.includes('AdminGuard')) {
    issues.push({
      type: 'RBAC',
      line: getLineNumber(content, content.indexOf('AdminGuard')),
      message:
        'AdminGuard found. Use JwtAuthGuard + PermissionsGuard + @RequirePermissions instead.',
    });
  }

  for (const decorator of HTTP_DECORATORS) {
    let searchIndex = 0;

    while (searchIndex < content.length) {
      const routeIndex = content.indexOf(decorator, searchIndex);

      if (routeIndex === -1) {
        break;
      }

      const block = getRouteDecoratorBlock(content, routeIndex);
      const hasResponseDecorator = RESPONSE_DECORATORS.some((response) =>
        block.includes(response),
      );

      if (!hasResponseDecorator) {
        issues.push({
          type: 'OPENAPI',
          line: getLineNumber(content, routeIndex),
          message: `${decorator} route is missing Swagger response decorator below the route decorator.`,
        });
      }

      searchIndex = routeIndex + decorator.length;
    }
  }

  return {
    file: relativePath,
    issues,
  };
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('❌ src directory not found. Run this from project root.');
    process.exit(1);
  }

  const results = walk(SRC_DIR)
    .map(auditController)
    .filter((result) => result.issues.length > 0);

  if (results.length === 0) {
    console.log('✅ API contract audit passed.');
    return;
  }

  console.error('❌ API contract audit failed.\n');

  for (const result of results) {
    console.error(result.file);

    for (const issue of result.issues) {
      console.error(`  - [${issue.type}] line ${issue.line}: ${issue.message}`);
    }

    console.error('');
  }

  process.exit(1);
}

main();
