import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'MandateBench',
      status: 'ok',
      description:
        'Benchmark of mandate faithfulness and pre-signature monitorability for agentic-payment LLM agents.',
    };
  }
}
