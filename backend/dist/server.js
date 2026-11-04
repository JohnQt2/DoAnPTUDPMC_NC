"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const prisma_client_1 = require("./shared/database/prisma.client");
async function bootstrap() {
    try {
        await (0, prisma_client_1.connectDatabase)();
        const server = app_1.app.listen(env_1.env.PORT, () => {
            console.log('====================================================');
            console.log(`🚀 ChinaEasy API Server running at http://localhost:${env_1.env.PORT}`);
            console.log(`📡 Environment: ${env_1.env.NODE_ENV}`);
            console.log(`🌐 Allowed Client: ${env_1.env.CLIENT_URL}`);
            console.log(`🏛️ Architecture: Modular Monolith (Prisma + SQLite/Postgres + Redis)`);
            console.log('====================================================');
        });
        const gracefulShutdown = async (signal) => {
            console.log(`\nReceived ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                await (0, prisma_client_1.disconnectDatabase)();
                console.log('Database disconnected. Process exited.');
                process.exit(0);
            });
        };
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    }
    catch (error) {
        console.error('Fatal error during bootstrap:', error);
        process.exit(1);
    }
}
bootstrap();
