import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TerminusModule } from '@nestjs/terminus';
import { envConfig } from 'src/config/constant/env.configuration';
import { configValidation } from 'src/config/validator/config.validator';
import { AudioModule } from 'src/transcribe/audio.module';
import { AppController } from './controller/app.controller';
import { AppService } from './service/app.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(envConfig.CONNECTION_STRING),
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: false,
      validationSchema: configValidation,
      envFilePath: ['.env'],
    }),
    TerminusModule,
    HttpModule,
    AudioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
