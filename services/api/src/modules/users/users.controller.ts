import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { UpdateUserAccountDto } from './dto/update-user-account.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter dados completos do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário obtido com sucesso',
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
            displayName: { type: 'string', example: 'Anna' },
            username: { type: 'string', example: 'devannalu' },
            phone: { type: 'string', nullable: true, example: null },
            cpf: { type: 'string', nullable: true, example: null },
            birthDate: { type: 'string', nullable: true, example: null },
            avatarUrl: { type: 'string', nullable: true, example: null },
            bio: { type: 'string', nullable: true, example: null },
            city: { type: 'string', example: 'Salvador' },
            state: { type: 'string', example: 'BA' },
            country: { type: 'string', example: 'Brasil' },
            notifyEmail: { type: 'boolean', example: true },
            notifyPush: { type: 'boolean', example: true },
            isPublic: { type: 'boolean', example: true },
          },
        },
        createdAt: { type: 'string', example: '2026-07-06T13:58:41.000Z' },
        updatedAt: { type: 'string', example: '2026-07-06T13:58:41.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token de acesso inválido ou expirado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Editar dados do perfil do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'profile-uuid' },
        userId: { type: 'string', example: 'user-uuid' },
        displayName: { type: 'string', example: 'Anna' },
        username: { type: 'string', example: 'devannalu' },
        phone: { type: 'string', example: '+5571999999999' },
        cpf: { type: 'string', example: '12345678909' },
        birthDate: { type: 'string', example: '2000-01-01T00:00:00.000Z' },
        avatarUrl: { type: 'string', example: 'https://example.com/avatar.png' },
        bio: { type: 'string', example: 'Bio do usuário' },
        city: { type: 'string', example: 'Salvador' },
        state: { type: 'string', example: 'BA' },
        country: { type: 'string', example: 'Brasil' },
        notifyEmail: { type: 'boolean', example: true },
        notifyPush: { type: 'boolean', example: true },
        isPublic: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2026-07-06T13:58:41.000Z' },
        updatedAt: { type: 'string', example: '2026-07-06T13:58:41.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de perfil inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Nome de usuário ou CPF já em uso' })
  updateProfile(@CurrentUser() user: AuthUser, @Body() updateProfileDto: UpdateUserProfileDto) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('me/account')
  @ApiOperation({ summary: 'Editar dados básicos da conta do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Conta atualizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        name: { type: 'string', example: 'Anna Luiza' },
        email: { type: 'string', example: 'newemail@example.com' },
        role: { type: 'string', example: 'USER' },
        status: { type: 'string', example: 'ACTIVE' },
        createdAt: { type: 'string', example: '2026-07-06T13:58:41.000Z' },
        updatedAt: { type: 'string', example: '2026-07-06T13:58:41.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de conta inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'E-mail já em uso por outro usuário' })
  updateAccount(@CurrentUser() user: AuthUser, @Body() updateAccountDto: UpdateUserAccountDto) {
    return this.usersService.updateAccount(user.id, updateAccountDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir logicamente a conta do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Conta excluída com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Conta excluída com sucesso.' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteMe(user.id);
  }
}
