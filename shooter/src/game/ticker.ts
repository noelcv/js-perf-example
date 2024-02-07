import { Writer } from "./data-writer";
// each time the function is called, we will return a number (next value) so we increment our next value, over and over again
export function ticker(rate: number, writer: Writer) {
  let next = Date.now() + rate;
  let previousNow = 0;

  //bye bye async function, this is now easily testable
  return function tickRunner() {
    const now = Date.now();
    const interval = now - previousNow;

    if (previousNow !== 0) {
      writer.write("tickInterval", interval);
      if (interval > rate + 1) {
        writer.count("tickIntervalOverrun");
      } else if (interval < Math.floor(rate - 1)) {
        writer.count("tickIntervalUnderrun");
      } else {
        writer.count("tickOnTime");
      }
    }

    let flooredNext = Math.floor(next);
    if (now > flooredNext) {
      flooredNext = now + 1; //slightly into the future is lower than now
      next = flooredNext + rate;
    } else {
      next = next + rate;
    }
    previousNow = now;
    // return a number only
    return flooredNext;
  };
}

type Callback = () => void;
//will map expirty time to callbacks
class Timer {
  private callbacks: Map<number, Callback[]>;
  private lastUpdateTime: number;
  private boundRun: () => void;

  constructor() {
    this.callbacks = new Map();
    this.lastUpdateTime = Date.now();
    this.boundRun = this.run.bind(this);
  }

  add(cb: Callback, when: number) {
    let callbacks = this.callbacks.get(when);
    if (!callbacks) {
      callbacks = [];
      this.callbacks.set(when, callbacks);
    }
    callbacks.push(cb);
  }

  static create() {
    const timer = new Timer();
    timer.run();
    return timer;
  }

  private run() {
    const start = Date.now();

    while (this.lastUpdateTime < start) {
      if (Date.now() - start > 2) {
        break;
      }
      const callbacks = this.callbacks.get(this.lastUpdateTime);

      if (callbacks) {
        for (const cb of callbacks) {
          cb();
        }
      }

      this.callbacks.delete(this.lastUpdateTime);
      this.lastUpdateTime++;
    }

    setTimeout(this.boundRun, 0); //run asap whenever data coming from ws
  }
}

const timer = Timer.create();
//singleton
export function getTimer(): Timer {
  return timer;
}
