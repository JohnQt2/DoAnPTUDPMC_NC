import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './shared/database/prisma.client';

async function bootstrap() {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 ChinaEasy API Server running at http://localhost:${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`🌐 Allowed Client: ${env.CLIENT_URL}`);
      console.log(`🏛️ Architecture: Modular Monolith (Prisma + SQLite/Postgres + Redis)`);
      console.log('====================================================');
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('Database disconnected. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('Fatal error during bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
