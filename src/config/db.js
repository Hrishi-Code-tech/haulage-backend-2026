// src/config/db.js
import { PrismaClient } from '@prisma/client';

// Export a single instance to be shared across all controllers
const prisma = new PrismaClient();

export default prisma;