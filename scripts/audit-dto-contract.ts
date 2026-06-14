import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';

type Finding = {
  file: string;
  message: string;
};

const findings: Finding[] = [];

const dtoFiles = globSync('src/**/*.dto.ts', {
  cwd: process.cwd(),
  absolute: false,
});

function isResponseDto(file: string): boolean {
  return file.includes('response');
}

function isInputDto(file: string): boolean {
  return !isResponseDto(file);
}

function add(file: string, message: string) {
  findings.push({ file, message });
}

function getPropertyBlocks(source: string): string[] {
  const lines = source.split('\n');
  const blocks: string[] = [];

  let index = 0;
  let pendingDecorators: string[] = [];

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('@')) {
      const decoratorLines = [line];

      let parenDepth =
        (line.match(/\(/g)?.length ?? 0) - (line.match(/\)/g)?.length ?? 0);

      index += 1;

      while (index < lines.length && parenDepth > 0) {
        const nextLine = lines[index];
        decoratorLines.push(nextLine);

        parenDepth +=
          (nextLine.match(/\(/g)?.length ?? 0) -
          (nextLine.match(/\)/g)?.length ?? 0);

        index += 1;
      }

      pendingDecorators.push(decoratorLines.join('\n'));
      continue;
    }

    const propertyMatch = trimmed.match(
      /^(?<name>[a-zA-Z_$][\w$]*)(?<optional>\?)?\s*[:!]\s*(?<type>[^;=]+)[;=]?/,
    );

    if (pendingDecorators.length > 0 && propertyMatch) {
      blocks.push([...pendingDecorators, line].join('\n'));
      pendingDecorators = [];
      index += 1;
      continue;
    }

    if (trimmed && !trimmed.startsWith('@')) {
      pendingDecorators = [];
    }

    index += 1;
  }

  return blocks;
}

function getPropertyName(propertyLine: string): string {
  return propertyLine.trim().split(/[\s?:!]/)[0] ?? 'unknown';
}

for (const file of dtoFiles) {
  const fullPath = join(process.cwd(), file);
  const source = readFileSync(fullPath, 'utf8');

  if (isResponseDto(file) && source.includes('ApiPropertyOptional')) {
    add(
      file,
      'Response DTO must not use ApiPropertyOptional. Use ApiProperty({ nullable: true }) for nullable fields.',
    );
  }

  const blocks = getPropertyBlocks(source);

  for (const block of blocks) {
    const propertyLine = block.split('\n').at(-1) ?? '';
    const propertyName = getPropertyName(propertyLine);

    const hasApiProperty = block.includes('@ApiProperty(');
    const hasApiPropertyOptional = block.includes('@ApiPropertyOptional(');
    const hasIsOptional =
      block.includes('@IsOptional(') || block.includes('@IsOptional()');

    const tsOptional = /^[a-zA-Z_$][\w$]*\?\s*:/.test(propertyLine.trim());
    const nullableType = propertyLine.includes('| null');

    if (isInputDto(file)) {
      if (hasApiPropertyOptional && !hasIsOptional && !tsOptional) {
        add(
          file,
          `${propertyName}: ApiPropertyOptional found, but field is not optional in TS and has no IsOptional().`,
        );
      }

      if (
        (hasIsOptional || tsOptional) &&
        hasApiProperty &&
        !hasApiPropertyOptional
      ) {
        add(
          file,
          `${propertyName}: optional input field should use ApiPropertyOptional, not ApiProperty.`,
        );
      }

      if (hasIsOptional && !tsOptional) {
        add(
          file,
          `${propertyName}: has IsOptional(), consider marking property optional with ?.`,
        );
      }
    }

    if (isResponseDto(file)) {
      if (nullableType && hasApiPropertyOptional) {
        add(
          file,
          `${propertyName}: nullable response field should use ApiProperty({ nullable: true }), not ApiPropertyOptional.`,
        );
      }
    }
  }
}

if (findings.length > 0) {
  console.error('❌ DTO contract audit failed.\n');

  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.message}`);
  }

  process.exit(1);
}

console.log('✅ DTO contract audit passed.');
