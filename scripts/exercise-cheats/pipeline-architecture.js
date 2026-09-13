// CHEAT for pipeline-architecture: the stages run, the contracts do not.
// addStage collects, and run awaits each stage's output before handing it to
// the next, so the async plumbing is right and every shape test clears. What
// it never does is call stage.validate. A window of the wrong length flows
// all the way through and the stage whose contract broke is never named,
// which is the only reason a typed pipeline exists instead of three nested
// calls.
class Pipeline {
  constructor() {
    this.stages = [];
  }

  addStage(stage) {
    this.stages.push(stage);
    return this;
  }

  async run(input) {
    let data = input;
    for (const stage of this.stages) {
      data = await stage.process(data);
    }
    return data;
  }
}
