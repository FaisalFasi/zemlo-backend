import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { minutes, Throttle } from '@nestjs/throttler';

import { MessageResponseDto } from '../../common/dto/message-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import {
  AuthSessionResponseDto,
  CurrentUserResponseDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({
    default: {
      limit: 5,
      ttl: minutes(60),
    },
  })
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({
    default: {
      limit: 10,
      ttl: minutes(10),
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({
    default: {
      limit: 3,
      ttl: minutes(60),
    },
  })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiOkResponse({ type: MessageResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({
    default: {
      limit: 10,
      ttl: minutes(60),
    },
  })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  @ApiOkResponse({ type: MessageResponseDto })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current logged-in user' })
  @ApiOkResponse({ type: CurrentUserResponseDto })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiOkResponse({ type: MessageResponseDto })
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user);
  }
}
