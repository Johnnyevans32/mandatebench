import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Result, ResultSchema } from './result.schema';
import { RunnerService } from './runner.service';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Result.name, schema: ResultSchema }]),
  ],
  controllers: [StudyController],
  providers: [StudyService, RunnerService],
  exports: [StudyService],
})
export class StudyModule {}
