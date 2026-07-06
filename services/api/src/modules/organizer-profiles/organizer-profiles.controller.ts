import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateOrganizerProfileDto } from './dto/create-organizer-profile.dto';
import { UpdateOrganizerProfileDto } from './dto/update-organizer-profile.dto';
import { OrganizerProfilesService } from './organizer-profiles.service';

@ApiTags('Organizer Profiles')
@Controller('organizer-profiles')
export class OrganizerProfilesController {
  constructor(private readonly organizerProfilesService: OrganizerProfilesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um Perfil Organizador' })
  @ApiResponse({
    status: 201,
    description: 'Perfil Organizador criado com sucesso e usuário registrado como OWNER.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        type: { type: 'string', example: 'COMMUNITY' },
        name: { type: 'string', example: 'Tech Sisters' },
        slug: { type: 'string', example: 'tech-sisters' },
        description: { type: 'string', example: 'Comunidade para mulheres na tecnologia.' },
        city: { type: 'string', example: 'Salvador' },
        state: { type: 'string', example: 'BA' },
        country: { type: 'string', example: 'Brasil' },
        isVerified: { type: 'boolean', example: false },
        isActive: { type: 'boolean', example: true },
        ownerId: { type: 'string', example: 'user-uuid' },
        createdAt: { type: 'string', example: '2026-07-06T14:27:07.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Slug já existente' })
  create(@CurrentUser() user: AuthUser, @Body() createDto: CreateOrganizerProfileDto) {
    return this.organizerProfilesService.create(user.id, createDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar Perfis Organizadores em que o usuário logado é membro ou dono' })
  @ApiResponse({
    status: 200,
    description: 'Lista obtida com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          name: { type: 'string', example: 'Tech Sisters' },
          slug: { type: 'string', example: 'tech-sisters' },
          type: { type: 'string', example: 'COMMUNITY' },
          city: { type: 'string', example: 'Salvador' },
          state: { type: 'string', example: 'BA' },
          isVerified: { type: 'boolean', example: false },
          isActive: { type: 'boolean', example: true },
          memberRole: { type: 'string', example: 'OWNER' },
          permissions: { type: 'array', items: { type: 'string' }, example: ['all'] },
          _count: {
            type: 'object',
            properties: {
              events: { type: 'integer', example: 0 },
              members: { type: 'integer', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.organizerProfilesService.findMine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter dados públicos de um Perfil Organizador pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do Perfil Organizador', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Perfil Organizador encontrado.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        type: { type: 'string', example: 'COMMUNITY' },
        name: { type: 'string', example: 'Tech Sisters' },
        slug: { type: 'string', example: 'tech-sisters' },
        description: { type: 'string', example: 'Comunidade para mulheres na tecnologia.' },
        logoUrl: { type: 'string', nullable: true, example: null },
        bannerUrl: { type: 'string', nullable: true, example: null },
        city: { type: 'string', example: 'Salvador' },
        state: { type: 'string', example: 'BA' },
        country: { type: 'string', example: 'Brasil' },
        website: { type: 'string', nullable: true, example: null },
        instagram: { type: 'string', example: '@tech.sisterss' },
        linkedin: { type: 'string', nullable: true, example: null },
        isVerified: { type: 'boolean', example: false },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2026-07-06T14:27:07.000Z' },
        _count: {
          type: 'object',
          properties: {
            events: { type: 'integer', example: 0 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Perfil Organizador não encontrado ou deletado' })
  findPublicById(@Param('id') id: string) {
    return this.organizerProfilesService.findPublicById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados de um Perfil Organizador' })
  @ApiParam({ name: 'id', description: 'ID do Perfil Organizador', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão negada (não é OWNER ou ADMIN do perfil)' })
  @ApiResponse({ status: 404, description: 'Perfil Organizador não encontrado' })
  @ApiResponse({ status: 409, description: 'Slug já em uso por outro perfil' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizerProfileDto,
  ) {
    return this.organizerProfilesService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir logicamente um Perfil Organizador' })
  @ApiParam({ name: 'id', description: 'ID do Perfil Organizador', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Perfil Organizador excluído com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Perfil Organizador excluído com sucesso.' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão negada (apenas OWNER pode excluir)' })
  @ApiResponse({ status: 404, description: 'Perfil Organizador não encontrado' })
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.organizerProfilesService.delete(user.id, id);
  }
}
