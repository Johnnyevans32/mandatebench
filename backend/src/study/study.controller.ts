import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import configuration from '../configuration';
import { RunnerService } from './runner.service';
import { StudyService } from './study.service';

@Controller()
export class StudyController {
  private readonly log = new Logger('Study');

  constructor(
    private readonly study: StudyService,
    private readonly runner: RunnerService,
  ) {}

  private snap(snapshot?: string): string {
    return snapshot || configuration().study.snapshotTag;
  }

  @Get('runner/status')
  status() {
    return { running: this.runner.isRunning() };
  }

  @Post('runner/run')
  run(@Query('snapshot') snapshot?: string, @Body('models') models?: string[]) {
    const snapshot_ = this.snap(snapshot);
    if (this.runner.isRunning()) {
      return { started: false, reason: 'runner already active' };
    }
    // Fire-and-forget: a full batch can take minutes, so return immediately and
    // let it run in the background. Poll /api/runner/status for completion.
    void this.runner
      .runBatch({ snapshot: snapshot_, models })
      .then((r) => this.log.log(`batch done: ${JSON.stringify(r)}`))
      .catch((e) => this.log.error(`batch failed: ${(e as Error).message}`));
    return { started: true, snapshot: snapshot_, models: models ?? 'default roster' };
  }

  @Get('leaderboard')
  leaderboard(@Query('snapshot') snapshot?: string) {
    return this.study.leaderboard(this.snap(snapshot));
  }

  @Get('matrix')
  matrix(@Query('snapshot') snapshot?: string) {
    return this.study.matrix(this.snap(snapshot));
  }

  @Get('spend')
  spend(@Query('snapshot') snapshot?: string) {
    return this.study.spend(this.snap(snapshot));
  }

  @Get('results')
  results(
    @Query('snapshot') snapshot?: string,
    @Query('model') model?: string,
  ) {
    return this.study.list(this.snap(snapshot), model);
  }

  @Get('transcript/:id')
  transcript(@Param('id') id: string) {
    return this.study.transcript(id);
  }
}
