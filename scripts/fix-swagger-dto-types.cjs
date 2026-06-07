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

function findDecoratorBlocks(content) {
  const blocks = [];
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

    blocks.push({
      start,
      end: cursor,
      text: content.slice(start, cursor),
    });
  }

  return blocks;
}

function findNextProperty(content, fromIndex) {
  const after = content.slice(fromIndex);
  const lines = after.split('\n');

  let offset = fromIndex;

  for (const line of lines) {
    const trimmed = line.trim();

    const match = trimmed.match(
      /^(readonly\s+)?([A-Za-z0-9_]+)(\?)?:\s*([^;]+);$/,
    );

    if (match) {
      return {
        name: match[2],
        tsType: match[4].trim(),
        index: offset,
      };
    }

    offset += line.length + 1;
  }

  return null;
}

function normalizeType(tsType) {
  return tsType
    .replace(/\s+/g, ' ')
    .replace(/\| null/g, '')
    .replace(/null \|/g, '')
    .replace(/\| undefined/g, '')
    .replace(/undefined \|/g, '')
    .replace(/\?/g, '')
    .trim();
}

function hasNullable(tsType) {
  return /\bnull\b/.test(tsType);
}

function getSwaggerType(tsType) {
  const cleanType = normalizeType(tsType);

  if (cleanType === 'string') return 'String';
  if (cleanType === 'number') return 'Number';
  if (cleanType === 'boolean') return 'Boolean';
  if (cleanType === 'Date') return 'Date';
  if (cleanType === 'unknown') return 'Object';
  if (cleanType === 'object') return 'Object';
  if (cleanType === 'Record<string, unknown>') return 'Object';
  if (cleanType === 'Record<string, any>') return 'Object';

  if (cleanType === 'string[]') return '[String]';
  if (cleanType === 'number[]') return '[Number]';
  if (cleanType === 'boolean[]') return '[Boolean]';
  if (cleanType === 'Date[]') return '[Date]';

  const arrayMatch = cleanType.match(/^(.+)\[\]$/);

  if (arrayMatch) {
    return `() => [${arrayMatch[1]}]`;
  }

  return `() => ${cleanType}`;
}

function hasSafeSchemaMetadata(decoratorText) {
  return SAFE_SCHEMA_KEYS.some((key) => decoratorText.includes(key));
}

function getDecoratorName(decoratorText) {
  return decoratorText.startsWith('@ApiPropertyOptional')
    ? 'ApiPropertyOptional'
    : 'ApiProperty';
}

function buildDecorator(decoratorText, tsType) {
  if (hasSafeSchemaMetadata(decoratorText)) {
    return decoratorText;
  }

  const decoratorName = getDecoratorName(decoratorText);
  const swaggerType = getSwaggerType(tsType);
  const nullable = hasNullable(tsType);

  const hasObjectArg = decoratorText.includes('{');

  if (!hasObjectArg) {
    const options = [`type: ${swaggerType}`];

    if (nullable) {
      options.push('nullable: true');
    }

    return `@${decoratorName}({ ${options.join(', ')} })`;
  }

  const typeEntry = `type: ${swaggerType}`;

  return decoratorText.replace('{', `{ ${typeEntry},`);
}

function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const blocks = findDecoratorBlocks(original);

  if (blocks.length === 0) {
    return false;
  }

  let output = original;
  let changed = false;

  for (const block of blocks.reverse()) {
    if (hasSafeSchemaMetadata(block.text)) {
      continue;
    }

    const property = findNextProperty(output, block.end);

    if (!property) {
      continue;
    }

    const fixedDecorator = buildDecorator(block.text, property.tsType);

    if (fixedDecorator === block.text) {
      continue;
    }

    output =
      output.slice(0, block.start) + fixedDecorator + output.slice(block.end);

    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, output, 'utf8');
  }

  return changed;
}

const files = walk(SRC_DIR);
const changedFiles = files.filter(fixFile);

if (changedFiles.length === 0) {
  console.log('✅ No Swagger DTO decorators needed fixing.');
  process.exit(0);
}

console.log('✅ Fixed Swagger DTO decorators in these files:\n');

for (const file of changedFiles) {
  console.log(`- ${path.relative(process.cwd(), file)}`);
}
