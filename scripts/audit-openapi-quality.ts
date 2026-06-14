import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type OpenApiSchema = {
  type?: string;
  nullable?: boolean;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  items?: OpenApiSchema;
  $ref?: string;
  allOf?: OpenApiSchema[];
  content?: Record<string, unknown>;
};

type OpenApiOperation = {
  operationId?: string;
  tags?: string[];
  responses?: Record<string, OpenApiSchema>;
};

type OpenApiDocument = {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
};

const requiredFrontendSchemas = [
  'AuthSessionResponseDto',
  'CurrentUserResponseDto',
  'CartResponseDto',
  'CheckoutResponseDto',
  'OrderSummaryResponseDto',
  'OrderDetailResponseDto',
  'PublicProductListItemResponseDto',
  'PublicProductDetailResponseDto',
  'AdminProductResponseDto',
];

const allowedLooseObjectFields = new Set([
  'PaymentMethodSettingResponseDto.metadata',
  'AdminProductVariantResponseDto.options',
  'ProductVariantResponseDto.options',
  'OrderItemResponseDto.productSnapshot',
  'OrderPaymentResponseDto.gatewayResponse',
  'OrderPaymentResponseDto.metadata',
  'PublicProductVariantResponseDto.options',
  'CartVariantResponseDto.options',
]);

const openapiPath = join(process.cwd(), 'openapi.json');
const document = JSON.parse(
  readFileSync(openapiPath, 'utf8'),
) as OpenApiDocument;

const blockers: string[] = [];
const warnings: string[] = [];

const allowedNoJsonResponseMethods = new Set(['delete']);

function hasJsonResponse(operation: OpenApiOperation): boolean {
  const responses = operation.responses ?? {};

  return Object.values(responses).some((response) => {
    const content = response.content;

    return Boolean(content?.['application/json']);
  });
}

function isResponseSchemaName(schemaName: string): boolean {
  return schemaName.endsWith('ResponseDto');
}

function checkPaths() {
  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const normalizedMethod = method.toLowerCase();

      if (
        !allowedNoJsonResponseMethods.has(normalizedMethod) &&
        !hasJsonResponse(operation)
      ) {
        blockers.push(
          `${normalizedMethod.toUpperCase()} ${path} (${operation.operationId ?? 'missing operationId'}) has no JSON response schema.`,
        );
      }

      if (operation.operationId?.includes('AppController')) {
        blockers.push(
          `${normalizedMethod.toUpperCase()} ${path} exposes default AppController endpoint.`,
        );
      }

      if (path.includes('webhook')) {
        warnings.push(
          `${normalizedMethod.toUpperCase()} ${path} is exposed in OpenAPI. Server-to-server webhooks usually should be excluded from frontend clients.`,
        );
      }
    }
  }
}

function checkRequiredSchemas() {
  const schemas = document.components?.schemas ?? {};

  for (const schemaName of requiredFrontendSchemas) {
    if (!schemas[schemaName]) {
      blockers.push(`Important frontend schema missing: ${schemaName}`);
    }
  }
}

function checkNullableResponseFields() {
  const schemas = document.components?.schemas ?? {};

  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (!isResponseSchemaName(schemaName)) {
      continue;
    }

    const required = new Set(schema.required ?? []);
    const properties = schema.properties ?? {};

    for (const [propertyName, propertySchema] of Object.entries(properties)) {
      const isNullable =
        propertySchema.nullable === true ||
        propertySchema.allOf?.some((item) => item.nullable === true);

      if (isNullable && !required.has(propertyName)) {
        warnings.push(
          `${schemaName}.${propertyName} is nullable but optional. For stable frontend types, prefer required nullable: ${propertyName}: T | null.`,
        );
      }
    }
  }
}

function checkLooseObjectFields() {
  const schemas = document.components?.schemas ?? {};

  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (!isResponseSchemaName(schemaName)) {
      continue;
    }

    const properties = schema.properties ?? {};

    for (const [propertyName, propertySchema] of Object.entries(properties)) {
      if (
        propertySchema.type === 'object' &&
        !propertySchema.properties &&
        !propertySchema.$ref &&
        !propertySchema.allOf
      ) {
        const fieldKey = `${schemaName}.${propertyName}`;

        if (allowedLooseObjectFields.has(fieldKey)) {
          continue;
        }
        warnings.push(
          `${schemaName}.${propertyName} is a loose object. If it is JSON metadata, keep it intentional; otherwise create a nested DTO.`,
        );
      }
    }
  }
}

checkPaths();
checkRequiredSchemas();
checkNullableResponseFields();
checkLooseObjectFields();

if (blockers.length > 0) {
  console.error('❌ OpenAPI quality audit failed.');

  for (const blocker of blockers) {
    console.error(`- ${blocker}`);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️ Warnings:');

    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  process.exit(1);
}

console.log('✅ OpenAPI quality audit passed.');

if (warnings.length > 0) {
  console.warn('\n⚠️ OpenAPI quality warnings:');

  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}
