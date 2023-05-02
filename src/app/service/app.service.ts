import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): {
    Status: string;
    Message: string;
  } {
    return {
      Status: 'Running',
      Message: 'Hello from Transcript Summarisation API!',
    };
  }
}
