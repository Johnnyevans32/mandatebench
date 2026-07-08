import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './configuration';

async function bootstrap() {
  const config = configuration();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  const origins = config.cors.origin.split(',').map((o) => o.trim());
  app.enableCors({
    // CORS_ORIGIN='*' reflects any origin (the read endpoints serve public
    // benchmark data); otherwise only the listed origins are allowed.
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  });

  // Bind 0.0.0.0 so Fly's proxy (and any container host) can reach it, not just
  // loopback. Port comes from PORT (Fly injects it via fly.toml [env]).
  await app.listen(config.port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`MandateBench backend listening on 0.0.0.0:${config.port}`);
}
void bootstrap();
