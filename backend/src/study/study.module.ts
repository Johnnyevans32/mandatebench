import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Duel, DuelSchema } from './duel.schema';
import { Result, ResultSchema } from './result.schema';
import { RunnerService } from './runner.service';
import { StudyController } from './study.controller';
import { StudyService } from './study.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Result.name, schema: ResultSchema },
      { name: Duel.name, schema: DuelSchema },
    ]),
  ],
  controllers: [StudyController],
  providers: [StudyService, RunnerService],
  exports: [StudyService],
})
export class StudyModule {}
