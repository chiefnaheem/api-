import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AudioController } from './controller/audio.controller';
import { Speech, SpeechSchema } from './schema/audio.schema';
import { AudioService } from './service/audio.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Speech.name, schema: SpeechSchema }]),
  ],
  providers: [AudioService],
  controllers: [AudioController],
})
export class AudioModule {}
