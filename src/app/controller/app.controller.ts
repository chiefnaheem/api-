import { Controller, Get } from '@nestjs/common';
import { AppService } from '../service/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): {
    Status: string;
    Message: string;
  } {
    return this.appService.getHello();
  }
}
