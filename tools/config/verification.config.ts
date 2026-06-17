export type VerificationProfile = 'quick' | 'full';

export type VerificationStep = {
  label: string;
  npmScript: string;
};

export const verificationProfiles: Record<
  VerificationProfile,
  readonly VerificationStep[]
> = {
  quick: [
    {
      label: 'Lint',
      npmScript: 'lint',
    },
    {
      label: 'Build',
      npmScript: 'build',
    },
  ],

  full: [
    {
      label: 'Lint',
      npmScript: 'lint',
    },
    {
      label: 'Build',
      npmScript: 'build',
    },
    {
      label: 'RBAC audit',
      npmScript: 'rbac:audit',
    },
    {
      label: 'DTO contract audit',
      npmScript: 'dto:contract:audit',
    },
    {
      label: 'Swagger DTO audit',
      npmScript: 'swagger:dto:audit',
    },
    {
      label: 'API contract audit',
      npmScript: 'api:contract:audit',
    },
    {
      label: 'OpenAPI export',
      npmScript: 'openapi:export',
    },
    {
      label: 'OpenAPI quality audit',
      npmScript: 'openapi:quality',
    },
    {
      label: 'Inventory lifecycle audit',
      npmScript: 'inventory:audit',
    },
  ],
};
