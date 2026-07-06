import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizerProfileDto } from './dto/create-organizer-profile.dto';
import { UpdateOrganizerProfileDto } from './dto/update-organizer-profile.dto';
import { generateSlug } from './utils/generate-slug.util';

@Injectable()
export class OrganizerProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo ou bloqueado');
    }
  }

  async generateUniqueSlug(name: string, requestedSlug?: string): Promise<string> {
    const baseSlug = requestedSlug ? generateSlug(requestedSlug) : generateSlug(name);
    let uniqueSlug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await this.prisma.organizerProfile.findFirst({
        where: { slug: uniqueSlug },
      });

      if (!existing) {
        break;
      }

      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  async create(userId: string, dto: CreateOrganizerProfileDto) {
    await this.checkUserActive(userId);

    const slug = await this.generateUniqueSlug(dto.name, dto.slug);

    const profile = await this.prisma.organizerProfile.create({
      data: {
        ownerId: userId,
        type: dto.type,
        name: dto.name,
        slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
        city: dto.city,
        state: dto.state,
        country: dto.country || 'Brasil',
        website: dto.website,
        instagram: dto.instagram,
        linkedin: dto.linkedin,
        email: dto.email,
        phone: dto.phone,
        members: {
          create: {
            userId,
            role: 'OWNER',
            isActive: true,
            joinedAt: new Date(),
            permissions: ['all'],
          },
        },
      },
    });

    return profile;
  }

  async findMine(userId: string) {
    await this.checkUserActive(userId);

    const memberships = await this.prisma.organizerMember.findMany({
      where: {
        userId,
        organizerProfile: {
          deletedAt: null,
        },
      },
      include: {
        organizerProfile: {
          include: {
            _count: {
              select: {
                events: true,
                members: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.organizerProfile.id,
      name: m.organizerProfile.name,
      slug: m.organizerProfile.slug,
      type: m.organizerProfile.type,
      city: m.organizerProfile.city,
      state: m.organizerProfile.state,
      isVerified: m.organizerProfile.isVerified,
      isActive: m.organizerProfile.isActive,
      memberRole: m.role,
      permissions: m.permissions,
      _count: m.organizerProfile._count,
    }));
  }

  async findPublicById(id: string) {
    const profile = await this.prisma.organizerProfile.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        city: true,
        state: true,
        country: true,
        website: true,
        instagram: true,
        linkedin: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil Organizador não encontrado');
    }

    return profile;
  }

  async ensureCanEdit(userId: string, organizerProfileId: string) {
    const profile = await this.prisma.organizerProfile.findFirst({
      where: {
        id: organizerProfileId,
        deletedAt: null,
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil Organizador não encontrado');
    }

    if (profile.ownerId === userId) {
      return profile;
    }

    const member = await this.prisma.organizerMember.findFirst({
      where: {
        organizerProfileId,
        userId,
        isActive: true,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!member) {
      throw new ForbiddenException('Você não tem permissão para editar este Perfil Organizador');
    }

    return profile;
  }

  async ensureIsOwner(userId: string, organizerProfileId: string) {
    const profile = await this.prisma.organizerProfile.findFirst({
      where: {
        id: organizerProfileId,
        deletedAt: null,
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil Organizador não encontrado');
    }

    if (profile.ownerId !== userId) {
      throw new ForbiddenException('Apenas o OWNER pode excluir este Perfil Organizador');
    }

    return profile;
  }

  async update(userId: string, id: string, dto: UpdateOrganizerProfileDto) {
    await this.checkUserActive(userId);
    await this.ensureCanEdit(userId, id);

    const updateData: any = { ...dto };

    if (dto.slug) {
      const slugNormalized = generateSlug(dto.slug);
      const slugExists = await this.prisma.organizerProfile.findFirst({
        where: {
          slug: slugNormalized,
          NOT: { id },
        },
      });

      if (slugExists) {
        throw new ConflictException('Este slug já está em uso por outro Perfil Organizador');
      }

      updateData.slug = slugNormalized;
    }

    const updatedProfile = await this.prisma.organizerProfile.update({
      where: { id },
      data: updateData,
    });

    return updatedProfile;
  }

  async delete(userId: string, id: string) {
    await this.checkUserActive(userId);
    await this.ensureIsOwner(userId, id);

    await this.prisma.organizerProfile.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Perfil Organizador excluído com sucesso.',
    };
  }
}
