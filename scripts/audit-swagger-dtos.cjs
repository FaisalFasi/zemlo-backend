const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');

const EXCLUDED_FILE_PARTS = ['create-', 'update-', 'login', 'register'];

const SAFE_SCHEMA_KEYS = [
  'type:',
  'enum:',
  'oneOf:',
  'anyOf:',
  'allOf:',
  'schema:',
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    if (!entry.isFile() || !entry.name.endsWith('.dto.ts')) {
      return [];
    }

    const shouldExclude = EXCLUDED_FILE_PARTS.some((part) =>
      entry.name.includes(part),
    );

    if (shouldExclude) {
      return [];
    }

    return [fullPath];
  });
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function findDecoratorBlocks(content) {
  const results = [];
  const regex = /@ApiProperty(?:Optional)?\s*\(/g;

  let match;

  while ((match = regex.exec(content)) !== null) {
    const start = match.index;
    let cursor = regex.lastIndex;
    let depth = 1;

    while (cursor < content.length && depth > 0) {
      const char = content[cursor];

      if (char === '(') {
        depth += 1;
      }

      if (char === ')') {
        depth -= 1;
      }

      cursor += 1;
    }

    results.push({
      start,
      end: cursor,
      text: content.slice(start, cursor),
    });
  }

  return results;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  const issues = [];

  const decorators = findDecoratorBlocks(content);

  for (const decorator of decorators) {
    const hasSafeSchemaKey = SAFE_SCHEMA_KEYS.some((key) =>
      decorator.text.includes(key),
    );

    if (!hasSafeSchemaKey) {
      issues.push({
        line: getLineNumber(content, decorator.start),
        decorator: decorator.text.split('\n')[0].trim(),
      });
    }
  }

  return {
    file: relativePath,
    issues,
  };
}

const results = walk(SRC_DIR)
  .map(auditFile)
  .filter((result) => result.issues.length > 0);

if (results.length === 0) {
  console.log(
    '✅ Swagger DTO audit passed. All response DTO decorators include explicit schema metadata.',
  );
  process.exit(0);
}

console.error('❌ Swagger DTO audit failed.\n');
console.error(
  'These response DTO decorators are missing explicit type/enum/schema metadata.\n',
);

for (const result of results) {
  console.error(result.file);

  for (const issue of result.issues) {
    console.error(`  - line ${issue.line}: ${issue.decorator}`);
  }

  console.error('');
}

process.exit(1);
