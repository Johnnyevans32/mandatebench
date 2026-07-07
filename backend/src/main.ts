import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './configuration';

async function bootstrap() {
  const config = configuration();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.cors.origin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await app.listen(config.port);
  // eslint-disable-next-line no-console
  console.log(`MandateBench backend listening on :${config.port}`);
}
void bootstrap();
