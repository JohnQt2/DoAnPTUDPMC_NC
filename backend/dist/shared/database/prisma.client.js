"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const env_1 = require("../../config/env");
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: env_1.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
if (env_1.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
async function connectDatabase() {
    await exports.prisma.$connect();
    console.log('✅ SQLite/Prisma Database connected successfully');
}
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
}
