// import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { SpeechService } from '../service/transcribe.service';

// @Controller('speech')
// export class SpeechController {
//   constructor(private speechService: SpeechService) {}

//   @Post('transcribe')
//   @UseInterceptors(FileInterceptor('audio'))
//   async transcribeSpeech(@UploadedFile() audio: Buffer): Promise<string> {
//     return this.speechService.transcribeSpeech(audio);
//   }

//   @Post('save')
//   async saveSpeech(): Promise<string> {
//     await this.speechService.saveSpeech();
//     return 'Speech saved successfully';
//   }
// }

import {
  Controller,
  Post,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UseFilters,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpExceptionFilter } from 'src/errors/error';
import { AudioService } from '../service/audio.service';
import * as path from 'path';
import * as fs from 'fs';

@Controller('audio')
@UseFilters(HttpExceptionFilter)
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post()
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudio(@Res() res: any) {
    //we want to get the path of 'recorded_audio.wav' file and make a buffer of the file to pass in check function
    const filePath = path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      'recorded_audio.wav',
    );
    //then make a buffer of the file
    const filename = 'recorded_audio.wav';
    const bufferOfFile = fs.readFileSync(filePath);
    const response = Buffer.from(bufferOfFile);

    const transcription = await this.audioService.check(response);
    const savedTranscription = await this.audioService.saveTranscription(
      transcription,
    );
    res.status(HttpStatus.OK).json(savedTranscription);
  }

  @Post('start-recording')
  async startRecording(@Res() res: any) {
    const filename = 'recorded_audio.wav';
    await this.audioService.startRecording(filename);
    res.status(HttpStatus.OK).json('Recording started');
  }

  @Post('stop-recording')
  async stopRecording(@Res() res: any) {
    await this.audioService.stopRecording();
    const transcription = await this.audioService.transcribeAudio();
    const savedTranscription = await this.audioService.saveTranscription(
      transcription,
    );

    res
      .status(HttpStatus.OK)
      .json({ message: 'Recording stopped', text: savedTranscription });
  }
}
