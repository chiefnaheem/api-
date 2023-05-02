// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Speech, SpeechDocument } from '../schema/transcribe.schema';
// import { IamAuthenticator } from 'ibm-watson/auth';
// // import { SpeechToTextV1 } from 'ibm-watson/speech-to-text/v1';
// const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');

// @Injectable()
// export class SpeechService {
//   constructor(@InjectModel(Speech.name) private speechModel: Model<SpeechDocument>) {}

// //   async transcribeSpeech(audio: Buffer): Promise<string> {
// //     const speechToText = new SpeechToTextV1({
// //       authenticator: new IamAuthenticator({ apikey: process.env.IBM_WATSON_API_KEY }),
// //       serviceUrl: process.env.IBM_WATSON_API_URL
// //     });

// //     const params = {
// //       audio: audio,
// //       contentType: 'audio/wav',
// //       model: 'en-US_BroadbandModel'
// //     };

// //     const { result } = await speechToText.recognize(params);
// //     return result.results.map((result: any) => result.alternatives[0].transcript).join('\n');
// //   }

// //   async saveSpeech(text: string): Promise<Speech> {
// //     const speech = new this.speechModel({ text, createdAt: new Date() });
// //     return speech.save();
// //   }

//   private transcribedText: string = '';

//   async transcribeSpeech(audio: Buffer): Promise<string> {
//     const speechToText = new SpeechToTextV1({
//         authenticator: new IamAuthenticator({ apikey: process.env.IBM_WATSON_API_KEY }),
//         serviceUrl: process.env.IBM_WATSON_API_URL
//       });

//       const params = {
//         audio: audio,
//         contentType: 'audio/wav',
//         model: 'en-US_BroadbandModel'
//       };

//       const { result } = await speechToText.recognize(params);
//     //   result.results.map((result: any) => result.alternatives[0].transcript).join('\n');
//       const text = result.results.map((result: any) => result.alternatives[0].transcript).join('\n');

//     // append the new text to the previous text
//     this.transcribedText += text + ' ';

//     return text;
//   }

//   async saveSpeech(): Promise<SpeechDocument> {
//     // save the concatenated text as a document in your database
//     const speech = new this.speechModel({ text: this.transcribedText });
//     const response = await speech.save();
//     // reset the text
//     this.transcribedText = '';
//     return response;
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Speech, SpeechDocument } from '../schema/transcribe.schema';
// import axios from 'axios';

// @Injectable()
// export class SpeechService {
//   private transcribedText: string = '';

//   constructor(@InjectModel(Speech.name) private speechModel: Model<SpeechDocument>) {}

//   async transcribeSpeech(audio: Buffer): Promise<string> {
//     const config = {
//       headers: {
//         'Authorization': `Bearer ${process.env.WHISPER_API_KEY}`,
//         'Content-Type': 'application/octet-stream',
//         'Transfer-Encoding': 'chunked',
//       },
//       params: {
//         'transcriptionConfig': JSON.stringify({
//           'languageCode': 'en-US',
//           'punctuation': true,
//           'diarization': true,
//           'model': 'default',
//         })
//       },
//       maxContentLength: Infinity,
//       maxBodyLength: Infinity,
//     };

//     const response = await axios.post(process.env.WHISPER_API_URL, audio, config);

//     const text = response.data.results[0].alternatives[0].transcript;

//     // append the new text to the previous text
//     this.transcribedText += text + ' ';

//     return text;
//   }

//   async saveSpeech(): Promise<SpeechDocument> {
//     // save the concatenated text as a document in your database
//     const speech = new this.speechModel({ text: this.transcribedText });
//     const response = await speech.save();
//     // reset the text
//     this.transcribedText = '';
//     return response;
//   }
// }

/*
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const mic = require("mic");
const { Readable } = require("stream");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: "YOUR_OPENAI_API_KEY",
});
const openai = new OpenAIApi(configuration);
ffmpeg.setFfmpegPath(ffmpegPath);

// Record audio
function recordAudio(filename) {
  return new Promise((resolve, reject) => {
    const micInstance = mic({
      rate: "16000",
      channels: "1",
      fileType: "wav",
    });

    const micInputStream = micInstance.getAudioStream();
    const output = fs.createWriteStream(filename);
    const writable = new Readable().wrap(micInputStream);

    console.log("Recording... Press Ctrl+C to stop.");

    writable.pipe(output);

    micInstance.start();

    process.on("SIGINT", () => {
      micInstance.stop();
      console.log("Finished recording");
      resolve();
    });

    micInputStream.on("error", (err) => {
      reject(err);
    });
  });
}

// Transcribe audio
async function transcribeAudio(filename) {
  const transcript = await openai.createTranscription(
    fs.createReadStream(filename),
    "whisper-1"
  );
  return transcript.data.text;
}

// Main function
async function main() {
  const audioFilename = "recorded_audio.wav";
  await recordAudio(audioFilename);
  const transcription = await transcribeAudio(audioFilename);
  console.log("Transcription:", transcription);
}

main();
*/

import {
  Injectable,
  InternalServerErrorException,
  UseFilters,
} from '@nestjs/common';
import { Readable } from 'stream';
import * as mic from 'mic';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { Configuration, OpenAIApi } from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Speech } from '../schema/audio.schema';
import * as path from 'path';
import * as FormData from 'form-data';

@Injectable()
export class AudioService {
  private readonly openai: OpenAIApi;
  constructor(@InjectModel(Speech.name) private audioModel: Model<Speech>) {
    const configuration = new Configuration({
      apiKey: process.env.OPEN_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
    ffmpeg.setFfmpegPath(ffmpegPath.path);
  }

  private micInstance: any = null;
  private output: any = null;

  async startRecording(filename: string): Promise<void> {
    this.micInstance = mic({
      rate: '16000',
      channels: '1',
      fileType: 'wav',
    });

    const micInputStream = this.micInstance.getAudioStream();
    this.output = fs.createWriteStream(filename);
    const writable = new Readable().wrap(micInputStream);

    console.log(`Recording...`);

    writable.pipe(this.output);

    this.micInstance.start();

    micInputStream.on('error', (err) => {
      console.log('Error in Input Stream: ' + err);
      throw new InternalServerErrorException(err);
    });
  }

  async stopRecording(): Promise<void> {
    if (this.micInstance) {
      this.micInstance.stop();
      this.output.end();
      console.log('Stopped recording');
      this.micInstance = null;
      this.output = null;
    }
  }

  async saveTranscription(transcription: string): Promise<Speech> {
    const createdAudio = new this.audioModel({ text: transcription });
    const summary = await this.summarize(transcription);
    createdAudio.summary = summary;
    return createdAudio.save();
  }

  async transcribeAudio(): Promise<string> {
    const filePath = path.join(__dirname, '../../../recorded_audio.wav');
    const audioData = await fs.promises.readFile(filePath);

    const transcript = await this.openai.createTranscription(
      fs.createReadStream(filePath) as unknown as File,
      'whisper-1',
    );
    return transcript.data.text;
  }

  async check(buffer: any): Promise<any> {
    const response = await this.openai.createTranscription(
      buffer, // The audio file to transcribe.
      'whisper-1', // The model to use for transcription.
      undefined, // The prompt to use for transcription.
      'json', // The format of the transcription.
      1, // Temperature
      'en', // Language
    );
    return response.data.text;
  }

  async summarize(text: string): Promise<string> {
    const response = await this.openai.createCompletion({
      model: 'text-davinci-002',
      prompt: text,
      temperature: 0.7,
      stop: ['\n', 'Summary:'],
    });
    return response.data.choices[0].text;
  }
}
