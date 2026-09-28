// src/config/db.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectDatabase = () => prisma.$connect();
export const disconnectDatabase = () => prisma.$disconnect();

export default prisma;