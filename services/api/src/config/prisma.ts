import { Prisma } from '@prisma/client';

export const prismaLogLevels: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'];
