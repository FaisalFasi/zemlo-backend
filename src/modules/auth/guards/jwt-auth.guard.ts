import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This protects routes.
// Before /auth/me runs, check if request has valid JWT token.
// If token is valid, continue.
// If token is invalid, reject request.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
