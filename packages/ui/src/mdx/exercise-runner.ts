/**
 * Executes user-submitted JS inside a Worker so sync infinite loops can be
 * terminated via worker.terminate() rather than relying on setTimeout (which
 * cannot fire while a sync loop blocks the event loop).
 *
 * Runs in browser via web Worker. Falls back to node:worker_threads in Node
 * (vitest / SSR) — dynamic import is hidden from bundlers via `new Function`
 * so Next.js/Vite client builds don't try to resolve `node:worker_threads`.
 */

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export type ConsoleLevel = "log" | "warn" | "error";

export interface ConsoleEntry {
  level: ConsoleLevel;
  message: string;
}

export interface TestRunOutcome {
  results: TestResult[];
  logs: ConsoleEntry[];
}

const HARNESS = `
  var __results = [];
  var __pending = [];
  var __currentDescribe = '';

  function describe(name, fn) {
    var prev = __currentDescribe;
    __currentDescribe = name;
    var ret;
    try { ret = fn(); } catch(e) { /* individual its handle errors */ }
    if (ret && typeof ret.then === 'function') {
      __pending.push(ret.catch(function(){}).then(function(){ __currentDescribe = prev; }));
    } else {
      __currentDescribe = prev;
    }
  }

  function it(name, fn) {
    var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
    var p = Promise.resolve().then(function() { return fn(); }).then(
      function() { __results.push({ name: fullName, passed: true }); },
      function(e) { __results.push({ name: fullName, passed: false, error: e.message || String(e) }); }
    );
    __pending.push(p);
  }
  var test = it;

  async function __awaitPending() {
    // Drain the queue — pending it()s may schedule more work.
    while (__pending.length > 0) {
      var batch = __pending.splice(0, __pending.length);
      await Promise.all(batch);
    }
  }

  function expect(actual) {
    return {
      toBe: function(expected) {
        if (actual !== expected) throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
      },
      toEqual: function(expected) {
        var a = JSON.stringify(actual), b = JSON.stringify(expected);
        if (a !== b) throw new Error('Expected ' + b + ' but got ' + a);
      },
      toBeDefined: function() {
        if (actual === undefined || actual === null) throw new Error('Expected value to be defined, got ' + String(actual));
      },
      toBeNull: function() {
        if (actual !== null) throw new Error('Expected null but got ' + JSON.stringify(actual));
      },
      toBeTruthy: function() {
        if (!actual) throw new Error('Expected truthy value but got ' + JSON.stringify(actual));
      },
      toBeFalsy: function() {
        if (actual) throw new Error('Expected falsy value but got ' + JSON.stringify(actual));
      },
      toBeGreaterThan: function(expected) {
        if (!(actual > expected)) throw new Error('Expected ' + actual + ' > ' + expected);
      },
      toBeLessThan: function(expected) {
        if (!(actual < expected)) throw new Error('Expected ' + actual + ' < ' + expected);
      },
      toBeGreaterThanOrEqual: function(expected) {
        if (!(actual >= expected)) throw new Error('Expected ' + actual + ' >= ' + expected);
      },
      toBeLessThanOrEqual: function(expected) {
        if (!(actual <= expected)) throw new Error('Expected ' + actual + ' <= ' + expected);
      },
      toContain: function(expected) {
        if (Array.isArray(actual)) {
          if (!actual.includes(expected)) throw new Error('Array does not contain ' + JSON.stringify(expected));
        } else if (typeof actual === 'string') {
          if (!actual.includes(expected)) throw new Error('String does not contain ' + JSON.stringify(expected));
        }
      },
      toHaveLength: function(expected) {
        if (actual.length !== expected) throw new Error('Expected length ' + expected + ' but got ' + actual.length);
      },
      toThrow: function() {
        if (typeof actual !== 'function') throw new Error('Expected a function');
        var threw = false;
        try { actual(); } catch(e) { threw = true; }
        if (!threw) throw new Error('Expected function to throw');
      },
      toBeCloseTo: function(expected, precision) {
        precision = precision === undefined ? 5 : precision;
        var diff = Math.abs(actual - expected);
        var limit = Math.pow(10, -precision) / 2;
        if (diff >= limit) throw new Error('Expected ' + actual + ' to be close to ' + expected + ' (precision: ' + precision + ')');
      },
      not: {
        toBe: function(expected) {
          if (actual === expected) throw new Error('Expected value to not be ' + JSON.stringify(expected));
        },
        toEqual: function(expected) {
          if (JSON.stringify(actual) === JSON.stringify(expected)) throw new Error('Expected values to not be equal');
        },
        toBeDefined: function() {
          if (actual !== undefined && actual !== null) throw new Error('Expected value to be undefined');
        },
        toBeNull: function() {
          if (actual === null) throw new Error('Expected value to not be null');
        },
        toBeTruthy: function() {
          if (actual) throw new Error('Expected falsy value');
        },
      }
    };
  }

  expect.closeTo = function(expected, precision) {
    precision = precision || 2;
    return {
      asymmetricMatch: function(actual) {
        return Math.abs(actual - expected) < Math.pow(10, -precision) / 2;
      }
    };
  };
`;

const TF_MOCK = `
  var tf = (function() {
    function toNested(flat, shape) {
      if (shape.length === 0) return flat[0];
      if (shape.length === 1) return Array.from(flat.slice(0, shape[0]));
      var outer = shape[0];
      var innerSize = shape.slice(1).reduce(function(a,b){return a*b;},1);
      var result = [];
      for (var i = 0; i < outer; i++) {
        result.push(toNested(flat.slice(i * innerSize, (i + 1) * innerSize), shape.slice(1)));
      }
      return result;
    }

    function makeTensor(flat, s) {
      return {
        dataSync: function() { return Float32Array.from(flat); },
        data: function() { return Promise.resolve(Float32Array.from(flat)); },
        arraySync: function() { return toNested(Array.from(flat), s); },
        array: function() { return Promise.resolve(toNested(Array.from(flat), s)); },
        shape: s,
        dtype: 'float32',
        rank: s.length,
        size: s.reduce(function(a,b){ return a*b; }, 1),
        reshape: function(newShape) { return makeTensor(Array.from(flat), newShape); },
        flatten: function() { return makeTensor(Array.from(flat), [flat.length]); },
        squeeze: function() {
          var newShape = s.filter(function(d) { return d !== 1; });
          if (newShape.length === 0) newShape = [1];
          return makeTensor(Array.from(flat), newShape);
        },
        add: function(other) { return _tf.add(this, other); },
        sub: function(other) { return _tf.sub(this, other); },
        mul: function(other) { return _tf.mul(this, other); },
        div: function(other) { return _tf.div(this, other); },
        sum: function() { return _tf.sum(this); },
        mean: function() { return _tf.mean(this); },
        max: function() { return _tf.max(this); },
        min: function() { return _tf.min(this); },
        argMax: function(axis) { return _tf.argMax(this, axis); },
        argMin: function(axis) { return _tf.argMin(this, axis); },
        exp: function() { return _tf.exp(this); },
        log: function() { return _tf.log(this); },
        abs: function() { return _tf.abs(this); },
        sqrt: function() { return _tf.sqrt(this); },
        std: function() {
          var m = flat.reduce(function(a,b){return a+b;},0)/flat.length;
          var v = flat.reduce(function(a,b){return a+(b-m)*(b-m);},0)/flat.length;
          return _tf.tensor([Math.sqrt(v)]);
        },
        print: function() {},
        dispose: function() {},
      };
    }

    var _tf = {
      tensor: function(data, shape) {
        var flat = Array.isArray(data) ? data.flat(Infinity) : [data];
        var s = shape || [flat.length];
        return makeTensor(flat, s);
      },
      tensor1d: function(values) { return _tf.tensor(values, [values.length]); },
      tensor2d: function(values, shape) {
        var flat = values.flat(Infinity);
        var s = shape || [values.length, values[0].length];
        return _tf.tensor(flat, s);
      },
      scalar: function(v) { return _tf.tensor([v], []); },
      zeros: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        return _tf.tensor(new Array(size).fill(0), shape);
      },
      ones: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        return _tf.tensor(new Array(size).fill(1), shape);
      },
      randomNormal: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        var data = [];
        for (var i = 0; i < size; i += 2) {
          var u1 = Math.random(), u2 = Math.random();
          var z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          var z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
          data.push(z0);
          if (i + 1 < size) data.push(z1);
        }
        return _tf.tensor(data, shape);
      },
      linspace: function(start, stop, num) {
        var data = [];
        var step = num > 1 ? (stop - start) / (num - 1) : 0;
        for (var i = 0; i < num; i++) data.push(start + step * i);
        return _tf.tensor(data, [num]);
      },
      range: function(start, limit, delta) {
        delta = delta || 1;
        var data = [];
        for (var v = start; delta > 0 ? v < limit : v > limit; v += delta) data.push(v);
        return _tf.tensor(data, [data.length]);
      },
      oneHot: function(indices, depth) {
        var idx = Array.isArray(indices) ? indices : Array.from(indices.dataSync());
        var data = [];
        for (var i = 0; i < idx.length; i++) {
          for (var j = 0; j < depth; j++) {
            data.push(j === idx[i] ? 1 : 0);
          }
        }
        return _tf.tensor(data, [idx.length, depth]);
      },
      concat: function(tensors, axis) {
        axis = axis || 0;
        var allData = [];
        for (var i = 0; i < tensors.length; i++) {
          allData = allData.concat(Array.from(tensors[i].dataSync()));
        }
        if (axis === 0) {
          var restShape = tensors[0].shape.slice(1);
          var totalFirst = 0;
          for (var t = 0; t < tensors.length; t++) totalFirst += tensors[t].shape[0];
          return _tf.tensor(allData, [totalFirst].concat(restShape));
        }
        return _tf.tensor(allData, [allData.length]);
      },
      add: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v+bd[i];}), a.shape); },
      sub: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v-bd[i];}), a.shape); },
      mul: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v*bd[i];}), a.shape); },
      div: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v/bd[i];}), a.shape); },
      relu: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.max(0,v);}), x.shape); },
      sigmoid: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return 1/(1+Math.exp(-v));}), x.shape); },
      softmax: function(x) { var d=Array.from(x.dataSync()); var max=Math.max.apply(null,d); var exp=d.map(function(v){return Math.exp(v-max);}); var sum=exp.reduce(function(a,b){return a+b;},0); return _tf.tensor(exp.map(function(v){return v/sum;}), x.shape); },
      tanh: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.tanh(v);}), x.shape); },
      exp: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.exp(v);}), x.shape); },
      log: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.log(v);}), x.shape); },
      abs: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.abs(v);}), x.shape); },
      sqrt: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.sqrt(v);}), x.shape); },
      pow: function(x, e) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.pow(v, e);}), x.shape); },
      neg: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return -v;}), x.shape); },
      sum: function(x) { var d=Array.from(x.dataSync()); var s=d.reduce(function(a,b){return a+b;},0); return _tf.tensor([s]); },
      mean: function(x) { var d=Array.from(x.dataSync()); var s=d.reduce(function(a,b){return a+b;},0)/d.length; return _tf.tensor([s]); },
      max: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor([Math.max.apply(null,d)]); },
      min: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor([Math.min.apply(null,d)]); },
      argMax: function(x) { var d=Array.from(x.dataSync()); var idx=0; for(var i=1;i<d.length;i++){if(d[i]>d[idx])idx=i;} return _tf.tensor([idx]); },
      argMin: function(x) { var d=Array.from(x.dataSync()); var idx=0; for(var i=1;i<d.length;i++){if(d[i]<d[idx])idx=i;} return _tf.tensor([idx]); },
      matMul: function(a, b) {
        if (a.shape[a.shape.length-1] !== b.shape[0]) {
          throw new Error('matMul: inner dimensions must match: [' + a.shape + '] vs [' + b.shape + ']');
        }
        var M = a.shape[0], K = a.shape[1] || 1, N = b.shape[1] || 1;
        var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
        var result = [];
        for (var i = 0; i < M; i++) {
          for (var j = 0; j < N; j++) {
            var s = 0;
            for (var k = 0; k < K; k++) {
              s += ad[i * K + k] * bd[k * N + j];
            }
            result.push(s);
          }
        }
        return _tf.tensor(result, [M, N]);
      },
      sequential: function() {
        var layers = [];
        return {
          add: function(layer) { layers.push(layer); },
          compile: function() {},
          fit: function(x,y,opts) { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1] } }); },
          predict: function(x) {
            var batchSize = x.shape[0];
            var lastUnits = layers.length > 0 && layers[layers.length-1].units ? layers[layers.length-1].units : 1;
            return _tf.zeros([batchSize, lastUnits]);
          },
          summary: function() {
            console.log('_________________________________________________________________');
            console.log('Layer (type)                 Output Shape              Param #');
            console.log('=================================================================');
            for (var i = 0; i < layers.length; i++) {
              var l = layers[i];
              var name = l.units ? 'dense' : (l.rate !== undefined ? 'dropout' : 'flatten');
              console.log(name + '                          varies                    0');
            }
            console.log('=================================================================');
          },
          layers: layers,
        };
      },
      layers: {
        dense: function(config) { return { units: config.units, activation: config.activation || 'linear', type: 'dense' }; },
        dropout: function(config) { return { rate: config.rate, type: 'dropout' }; },
        flatten: function() { return { type: 'flatten' }; },
      },
    };

    return _tf;
  })();
`;

function buildFullCode(userCode: string, testCode: string): string {
  const cleanCode = userCode.replace(
    /^import\s+.*from\s+['"].*['"];?\s*$/gm,
    "",
  );
  return `${TF_MOCK}\n${HARNESS}\n${cleanCode}\nreturn (async function() {\n${testCode}\nawait __awaitPending();\nreturn __results;\n})();`;
}

// Worker body (string). Feature-detects web Worker vs node:worker_threads.
const WORKER_BODY = `
(function() {
  var isNode = typeof process !== 'undefined' && process.versions && process.versions.node && typeof importScripts === 'undefined';
  var post, listen;
  if (isNode) {
    var wt = require('node:worker_threads');
    var parent = wt.parentPort;
    post = function(m) { parent.postMessage(m); };
    listen = function(cb) { parent.on('message', cb); };
  } else {
    post = function(m) { postMessage(m); };
    listen = function(cb) { addEventListener('message', function(e) { cb(e.data); }); };
  }

  var logs = [];
  function stringifyArg(a) {
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }
  var capturedConsole = {
    log: function() { logs.push({ level: 'log', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
    warn: function() { logs.push({ level: 'warn', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
    error: function() { logs.push({ level: 'error', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
    info: function() { logs.push({ level: 'log', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
    debug: function() { logs.push({ level: 'log', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
  };

  listen(function(msg) {
    var code = msg && msg.code;
    if (typeof code !== 'string') return;
    (async function() {
      try {
        var fn = new Function('console', code);
        var results = await fn(capturedConsole);
        post({ ok: true, results: results, logs: logs });
      } catch (err) {
        post({ ok: false, error: (err && err.message) || String(err), logs: logs });
      }
    })();
  });
})();
`;

type WorkerReply =
  | { ok: true; results: TestResult[]; logs: ConsoleEntry[] }
  | { ok: false; error: string; logs: ConsoleEntry[] };

export interface WorkerHandle {
  send: (msg: unknown) => void;
  onReply: (cb: (reply: WorkerReply) => void) => void;
  terminate: () => Promise<void> | void;
}

export type { WorkerReply };

export type SpawnWorker = () => Promise<WorkerHandle>;

export const WORKER_BODY_STRING = WORKER_BODY;

function defaultSpawnWorker(): Promise<WorkerHandle> {
  if (
    typeof Worker === "undefined" ||
    typeof Blob === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    throw new Error(
      "Web Worker not available in this environment. Use the Node runner (exercise-runner-node.ts) for tests / SSR.",
    );
  }
  const blob = new Blob([WORKER_BODY], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const w = new Worker(url);
  return Promise.resolve({
    send: (m) => w.postMessage(m),
    onReply: (cb) => {
      w.onmessage = (e: MessageEvent) => cb(e.data as WorkerReply);
    },
    terminate: () => {
      w.terminate();
      URL.revokeObjectURL(url);
    },
  });
}

export async function parseAndRunTestsWith(
  spawn: SpawnWorker,
  userCode: string,
  testCode: string,
  timeoutMs = 10_000,
): Promise<TestRunOutcome> {
  const code = buildFullCode(userCode, testCode);

  let handle: WorkerHandle;
  try {
    handle = await spawn();
  } catch (err) {
    return {
      results: [
        {
          name: "Code execution",
          passed: false,
          error: err instanceof Error ? err.message : String(err),
        },
      ],
      logs: [],
    };
  }

  return await new Promise<TestRunOutcome>((resolve) => {
    let settled = false;
    const finish = (outcome: TestRunOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      Promise.resolve(handle.terminate()).catch(() => {});
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      finish({
        results: [
          {
            name: "Code execution",
            passed: false,
            error: `Timed out after ${Math.round(timeoutMs / 1000)} seconds`,
          },
        ],
        logs: [],
      });
    }, timeoutMs);

    handle.onReply((reply) => {
      if (reply.ok) {
        finish({ results: reply.results, logs: reply.logs });
      } else {
        finish({
          results: [
            { name: "Code execution", passed: false, error: reply.error },
          ],
          logs: reply.logs,
        });
      }
    });

    handle.send({ code });
  });
}

export async function parseAndRunTests(
  userCode: string,
  testCode: string,
  timeoutMs = 10_000,
): Promise<TestRunOutcome> {
  return parseAndRunTestsWith(
    defaultSpawnWorker,
    userCode,
    testCode,
    timeoutMs,
  );
}
