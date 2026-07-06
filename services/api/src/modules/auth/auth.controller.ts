import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { AuthUser } from './types/auth-user.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastrar um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário cadastrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            name: { type: 'string', example: 'Anna Luiza' },
            email: { type: 'string', example: 'anna@example.com' },
            role: { type: 'string', example: 'USER' },
            status: { type: 'string', example: 'ACTIVE' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'jwt.access.token' },
            refreshToken: { type: 'string', example: 'jwt.refresh.token' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de cadastro inválidos' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            name: { type: 'string', example: 'Anna Luiza' },
            email: { type: 'string', example: 'anna@example.com' },
            role: { type: 'string', example: 'USER' },
            status: { type: 'string', example: 'ACTIVE' },
          },
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'jwt.access.token' },
            refreshToken: { type: 'string', example: 'jwt.refresh.token' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renovar tokens usando o Refresh Token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'new.jwt.access.token' },
        refreshToken: { type: 'string', example: 'new.jwt.refresh.token' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh Token inválido ou expirado' })
  refresh(@CurrentUser() user: AuthUser) {
    return this.authService.refreshTokens(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do perfil autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do perfil obtidos com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        name: { type: 'string', example: 'Anna Luiza' },
        email: { type: 'string', example: 'anna@example.com' },
        role: { type: 'string', example: 'USER' },
        status: { type: 'string', example: 'ACTIVE' },
        profile: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'profile-uuid' },
            displayName: { type: 'string', nullable: true, example: null },
            username: { type: 'string', nullable: true, example: null },
          },
        },
        createdAt: { type: 'string', example: '2026-07-06T13:58:41.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token de acesso inválido ou expirado' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }
}
