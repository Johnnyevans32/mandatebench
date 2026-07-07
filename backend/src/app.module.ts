import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { StudyModule } from './study/study.module';
import configuration from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], cache: true }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: configuration().mongodb.uri,
        autoIndex: true,
        autoCreate: true,
      }),
    }),
    StudyModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
