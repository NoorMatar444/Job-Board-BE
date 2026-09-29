import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SecurityService } from './securityService.js';
import { TokenService } from './services/token.services.js';
import { UserRepo } from './repo/user.repo.js';
import UserModel from './model/user.model.js';
import { RedisModule } from './services/reids.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { JobModule } from './modules/job/job.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env.docker'],
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_URL || 'mongodb://localhost:27017/job-board', {
      onConnectionCreate: (connection: Connection) => {
        connection.on('connected', () => console.log('connected'));
        connection.on('open', () => console.log('open'));
        connection.on('disconnected', () => console.log('disconnected'));
        connection.on('reconnected', () => console.log('reconnected'));
        connection.on('disconnecting', () => console.log('disconnecting'));

        return connection;
      },
    }),
    UserModel,
    RedisModule,
    UserModule,
    AuthModule,
    JobModule,
  ],
  controllers: [AppController],
  providers: [AppService, SecurityService, TokenService, UserRepo],
})
export class AppModule {}
