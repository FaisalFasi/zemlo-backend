import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
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
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import {
  AuthSessionResponseDto,
  CurrentUserResponseDto,
  LoginDto,
  RegisterDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current logged-in user' })
  @ApiOkResponse({ type: CurrentUserResponseDto })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiOkResponse({ type: MessageResponseDto })
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user);
  }
}
