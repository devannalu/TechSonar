import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserAccountDto } from './dto/update-user-account.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.status === 'DELETED') {
      throw new UnauthorizedException('Esta conta foi excluída');
    }

    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('Esta conta está suspensa ou bloqueada');
    }

    return user;
  }

  async getMe(userId: string) {
    await this.checkUserActive(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            id: true,
            displayName: true,
            username: true,
            phone: true,
            cpf: true,
            birthDate: true,
            avatarUrl: true,
            bio: true,
            city: true,
            state: true,
            country: true,
            notifyEmail: true,
            notifyPush: true,
            isPublic: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    await this.checkUserActive(userId);

    if (dto.username) {
      const usernameExists = await this.prisma.userProfile.findFirst({
        where: {
          username: dto.username,
          NOT: { userId },
        },
      });

      if (usernameExists) {
        throw new ConflictException('Este nome de usuário já está em uso');
      }
    }

    if (dto.cpf) {
      const cpfExists = await this.prisma.userProfile.findFirst({
        where: {
          cpf: dto.cpf,
          NOT: { userId },
        },
      });

      if (cpfExists) {
        throw new ConflictException('Este CPF já está cadastrado por outro usuário');
      }
    }

    const updatedProfile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        displayName: dto.displayName,
        username: dto.username,
        phone: dto.phone,
        cpf: dto.cpf,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        avatarUrl: dto.avatarUrl,
        bio: dto.bio,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        notifyEmail: dto.notifyEmail,
        notifyPush: dto.notifyPush,
        isPublic: dto.isPublic,
      },
    });

    return updatedProfile;
  }

  async updateAccount(userId: string, dto: UpdateUserAccountDto) {
    const user = await this.checkUserActive(userId);

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (emailExists) {
        throw new ConflictException('Este e-mail já está em uso por outro usuário');
      }
    }

    const dataToUpdate: any = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name;
    if (dto.email !== undefined && dto.email !== user.email) {
      dataToUpdate.email = dto.email;
      dataToUpdate.emailVerifiedAt = null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteMe(userId: string) {
    const user = await this.checkUserActive(userId);

    // Anonimiza o email para permitir que um novo cadastro seja feito com o mesmo email original futuramente
    const timestamp = Date.now();
    const anonymizedEmail = `deleted_${timestamp}_${user.email}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'DELETED',
        email: anonymizedEmail,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Conta excluída com sucesso.',
    };
  }
}
