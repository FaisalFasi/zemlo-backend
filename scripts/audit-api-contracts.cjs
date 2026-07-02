function auditController(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  const isExcludedController = content.includes('@ApiExcludeController');

  if (IGNORED_FILES.has(relativePath) || isExcludedController) {
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

      const isExcludedEndpoint = block.includes('@ApiExcludeEndpoint');

      const hasResponseDecorator = RESPONSE_DECORATORS.some((response) =>
        block.includes(response),
      );

      if (!isExcludedEndpoint && !hasResponseDecorator) {
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
