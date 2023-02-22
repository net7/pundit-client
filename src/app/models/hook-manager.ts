type NextFn = () => void;

type HookFn = (ctx, next: NextFn) => void;

class HookManager {
  private hooks: {
    [type: string]: HookFn[];
  } = {};

  on = (type: string, fn: HookFn) => {
    this.hooks[type] = this.hooks[type] || [];
    this.hooks[type].push(fn);
  }

  trigger = (type: string, context, callback) => {
    const hooks = [
      ...(this.hooks[type] || [])
    ];
    // add last hook
    hooks.push(callback);

    let index = 0;
    const run = (curIndex) => {
      index = curIndex + 1;
      const fn = hooks[curIndex];
      if (fn) {
        fn(context, () => run(index));
      }
    };

    // first run
    run(index);
  }
}

export const hookManager = new HookManager();
