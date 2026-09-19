/**
 * Executes user-submitted JS inside a Worker so sync infinite loops can be
 * terminated via worker.terminate() rather than relying on setTimeout (which
 * cannot fire while a sync loop blocks the event loop).
 *
 * Runs in browser via web Worker. Falls back to node:worker_threads in Node
 * (vitest / SSR), dynamic import is hidden from bundlers via `new Function`
 * so Next.js/Vite client builds don't try to resolve `node:worker_threads`.
 */

import { FIT_RECORDING_SOURCE } from "./exercise-fit-recording.mjs";

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
  /**
   * True when the run never produced graded results: execution timeout,
   * runtime-load failure, a crash before grading, or a syntax error in the
   * submitted code (which is rejected before the worker starts, see
   * userCodeSyntaxError). The runner RESOLVES in every failure mode (never
   * rejects), so callers that want to count ungraded runs must read this
   * flag rather than a catch branch (2026-09-04 re-audit: the analytics
   * errored branch was dead code).
   */
  errored?: boolean;
}

const HARNESS = `
  var __results = [];
  var __pending = [];
  var __currentDescribe = '';

  function describe(name, fn) {
    var prev = __currentDescribe;
    // Hooks are describe-scoped (mirrors the CI grader + vitest): siblings
    // must not inherit each other's beforeEach/afterEach registrations.
    var savedBE = __beforeEach.slice();
    var savedAE = __afterEach.slice();
    __currentDescribe = name;
    var ret;
    try { ret = fn(); } catch(e) {
      // A throw in a describe BODY silently dropped every later it() and
      // the UI then read the surviving green subset as "All tests passed!"
      // (fresh-eyes rerun §6). Record it as a failing result so a
      // partially-defined suite can never present as a pass.
      __results.push({
        name: name + ' > (suite body threw before defining all tests)',
        passed: false,
        error: (e && e.message) || String(e)
      });
    }
    if (ret && typeof ret.then === 'function') {
      __pending.push(ret.catch(function(){}).then(function(){
        __currentDescribe = prev;
        __beforeEach = savedBE;
        __afterEach = savedAE;
      }));
    } else {
      __currentDescribe = prev;
      __beforeEach = savedBE;
      __afterEach = savedAE;
    }
  }

  var __beforeEach = [];
  var __afterEach = [];

  // beforeAll runs immediately (describe bodies register it before any it()
  // callback executes, since its run on microtasks). Async setups are queued
  // so __awaitPending drains them before results are read.
  function beforeAll(fn) {
    try {
      var r = fn && fn();
      if (r && typeof r.then === 'function') __pending.push(Promise.resolve(r).catch(function(){}));
    } catch (e) { /* setup errors surface as failing assertions */ }
  }
  function afterAll(fn) {
    __pending.push(Promise.resolve().then(function() { return fn && fn(); }).catch(function(){}));
  }
  function beforeEach(fn) { __beforeEach.push(fn); }
  function afterEach(fn) { __afterEach.push(fn); }

  function it(name, fn) {
    var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
    var beSnapshot = __beforeEach.slice();
    var aeSnapshot = __afterEach.slice();
    var p = Promise.resolve().then(async function() {
      for (var i = 0; i < beSnapshot.length; i++) await beSnapshot[i]();
      await fn();
      for (var j = 0; j < aeSnapshot.length; j++) await aeSnapshot[j]();
    }).then(
      function() { __results.push({ name: fullName, passed: true }); },
      function(e) { __results.push({ name: fullName, passed: false, error: e.message || String(e) }); }
    );
    __pending.push(p);
  }
  var test = it;
  it.skip = function(){};
  it.only = it;
  test.skip = function(){};
  test.only = it;
  describe.skip = function(){};
  describe.only = describe;

  async function __awaitPending() {
    // Drain the queue, pending it()s may schedule more work.
    while (__pending.length > 0) {
      var batch = __pending.splice(0, __pending.length);
      await Promise.all(batch);
    }
  }

  /* --- shared-assertions: kept byte-identical (modulo whitespace) between
     packages/ui/src/mdx/exercise-runner.ts, the harness a learner runs in the
     browser, and scripts/validate-exercises.mjs, the harness CI grades with.
     assertHarnessParity() in the validator compares every function marked
     below, and assertAssertionParity() runs a fixture suite through both
     harnesses and compares every resulting failure string, because a
     divergence here lets a submission pass in one harness and fail in the
     other.

     FAILURE-TEXT RULE, which exercise authors follow when they write a
     message of their own:

     1. A failure never prints the expected side of an equality or closeness
        check when that value is a number, or an array or object holding a
        number. Those are graded answers. The results panel opens on the
        first Run of the untouched starter, so printing them hands over the
        answer for one click, and unlike the hint ladder it is not recorded
        as a reveal.
     2. In place of the answer the message reports three things: the value
        the learner produced, the direction of the miss (too high, too low)
        or the position of the first difference, and the rule the check
        enforces (its tolerance, its required length, its required shape).
     3. Strings, booleans, null, undefined, regexes, constructor names,
        lengths and shapes ARE printed. They name an API choice or a
        structure rather than a computed answer, and withholding them turns
        a typo into a guessing game.
     4. A threshold is a rule, not an answer, so toBeGreaterThan and its
        siblings keep naming the bar the value has to clear.
     5. The teaching half comes from the author: expect takes an optional
        second argument, and whatever it says is printed above the
        discrepancy. Write why the failure means what it means.
            expect(loss, 'A rising loss means the step went uphill.')
              .toBeLessThan(previous);
  --- */

  function __tcDefaultPrecision() {
    // Deliberately tighter than the vitest default of 2, because these
    // exercises grade numeric ML output where 2 decimals would accept a
    // wrong answer. Authors who want a looser bar pass precision
    // explicitly; the validator prints an advisory for every site that
    // leaves it out.
    return 5;
  }

  function __tcTolerance(p) {
    // Printed, not compared: Math.pow(10, -5) / 2 is 0.0000049999999999999996
    // in binary floating point, and that tail is noise in a failure message.
    var limit = Math.pow(10, -p) / 2;
    return String(Number(limit.toPrecision(2)));
  }

  function __tcMessage(why, detail) {
    var d = detail == null ? '' : String(detail);
    if (why === undefined || why === null || why === '') return d;
    if (!d) return String(why);
    return String(why) + '\\n' + d;
  }

  // Realm-safe RegExp test. Test code runs in its own realm (a vm context in

  // CI, the worker body in the browser), so a regex literal written in an

  // exercise is NOT an instanceof this realm's RegExp. Duck-typing via the

  // toString tag is the only check that holds across both harnesses; an

  // instanceof here silently degrades every regex assertion into a substring

  // search for the regex's own source text.

  function __tcIsRe(p) {

    return Object.prototype.toString.call(p) === '[object RegExp]';

  }

  function __tcShow(v) {
    // JSON.stringify turns NaN and Infinity into 'null', which would report
    // a failed calculation as a missing value.
    if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
    var s;
    try {
      s = JSON.stringify(v);
    } catch (e) {
      s = null;
    }
    if (s === undefined || s === null) s = String(v);
    return s.length > 140 ? s.slice(0, 137) + '...' : s;
  }

  function __tcType(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    // v !== v is true only for NaN, and needs no global helper.
    if (typeof v === 'number' && v !== v) return 'NaN';
    return typeof v;
  }

  function __tcNamed(v) {
    // 'null (null)' and 'undefined (undefined)' read as a stutter, so name
    // the type once when the type IS the whole value.
    var t = __tcType(v);
    var shown = __tcShow(v);
    return shown === t ? t : t + ' (' + shown + ')';
  }

  function __tcHasNumber(v) {
    if (typeof v === 'number') return true;
    if (v === null || typeof v !== 'object') return false;
    if (Array.isArray(v)) {
      for (var i = 0; i < v.length; i++) if (__tcHasNumber(v[i])) return true;
      return false;
    }
    for (var k in v) if (__tcHasNumber(v[k])) return true;
    return false;
  }

  function __tcListOf(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object' && typeof v.length === 'number') {
      return Array.prototype.slice.call(v);
    }
    return null;
  }

  function __tcNumberMiss(actual, expected) {
    if (typeof expected !== 'number') return __tcStructureMiss(actual, expected);
    if (typeof actual !== 'number') {
      return 'Got ' + __tcNamed(actual) + ' where a number was required.';
    }
    if (actual !== actual) return 'Got NaN, so the calculation produced no number.';
    return 'Got ' + actual + ', which is too ' + (actual > expected ? 'high' : 'low') + '.';
  }

  function __tcStructureMiss(actual, expected) {
    if (Array.isArray(expected)) {
      var a = __tcListOf(actual);
      if (a === null) {
        return 'Got ' + __tcNamed(actual) + ' where a list of ' + expected.length + ' was required.';
      }
      if (a.length !== expected.length) {
        return 'Your list has ' + a.length + ' entries; ' + expected.length + ' were required.';
      }
      var first = -1;
      var n = 0;
      for (var i = 0; i < expected.length; i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(expected[i])) {
          n++;
          if (first < 0) first = i;
        }
      }
      if (n === 0) {
        if (!Array.isArray(actual)) {
          return 'Your values match entry by entry, but the container is a ' + (actual && actual.constructor && actual.constructor.name ? actual.constructor.name : __tcType(actual)) + ' where a plain array was required. Array.from converts it.';
        }
        return 'Your list matches entry by entry but is not the same object.';
      }
      return 'Your list is the right length. ' + n + ' of ' + expected.length + ' entries differ, the first at index ' + first + ' (yours: ' + __tcShow(a[first]) + ').';
    }
    if (expected !== null && typeof expected === 'object') {
      if (actual === null || typeof actual !== 'object') {
        return 'Got ' + __tcNamed(actual) + ' where an object was required.';
      }
      var keys = Object.keys(expected);
      var missing = [];
      var differ = [];
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        if (!(key in actual)) missing.push(key);
        else if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) differ.push(key);
      }
      if (missing.length) {
        return 'Your object has no ' + missing[0] + ' key (' + missing.length + ' of the ' + keys.length + ' required keys are missing).';
      }
      if (differ.length) {
        return 'Your ' + differ[0] + ' is ' + __tcShow(actual[differ[0]]) + ', which this check rejects (' + differ.length + ' of ' + keys.length + ' keys differ).';
      }
      return 'Your object carries the ' + keys.length + ' required keys plus extras this check rejects.';
    }
    return 'Got ' + __tcShow(actual) + '.';
  }

  function __tcJest() {
    var jestStub = {
      fn: function(impl) {
        var calls = [];
        var instances = [];
        var f = function() {
          var args = Array.prototype.slice.call(arguments);
          calls.push(args);
          instances.push(this);
          return impl ? impl.apply(this, args) : undefined;
        };
        f.mock = { calls: calls, instances: instances, results: [] };
        f.mockReturnValue = function(v) { impl = function() { return v; }; return f; };
        f.mockResolvedValue = function(v) { impl = function() { return Promise.resolve(v); }; return f; };
        f.mockImplementation = function(i) { impl = i; return f; };
        f.mockClear = function() { calls.length = 0; instances.length = 0; };
        return f;
      },
      spyOn: function(obj, method) {
        var original = obj[method];
        var spy = jestStub.fn(original);
        obj[method] = spy;
        spy.mockRestore = function() { obj[method] = original; };
        return spy;
      },
      clearAllMocks: function() {},
      resetAllMocks: function() {},
      useFakeTimers: function() {},
      useRealTimers: function() {},
    };
    return jestStub;
  }

  function __tcInstallStatics(fn) {
    fn.closeTo = function(expected, precision) {
      var p = precision === undefined ? 2 : precision;
      return {
        asymmetricMatch: function(actual) {
          return Math.abs(actual - expected) < Math.pow(10, -p) / 2;
        },
      };
    };
    fn.any = function(ctor) {
      return {
        asymmetricMatch: function(a) {
          var name = String(ctor && ctor.name).toLowerCase();
          return a != null && (typeof a === name || a instanceof ctor);
        },
      };
    };
    fn.anything = function() {
      return {
        asymmetricMatch: function(a) { return a != null; },
      };
    };
    fn.stringContaining = function(s) {
      return {
        asymmetricMatch: function(a) { return typeof a === 'string' && a.indexOf(s) !== -1; },
      };
    };
    fn.stringMatching = function(re) {
      return {
        asymmetricMatch: function(a) {
          return typeof a === 'string' && (__tcIsRe(re) ? re : new RegExp(re)).test(a);
        },
      };
    };
    return fn;
  }

  function __tcMatchers(actual, __why) {
    function fail(detail) {
      throw new Error(__tcMessage(__why, detail));
    }
    function contains(needle) {
      if (typeof actual === 'string') return actual.indexOf(String(needle)) !== -1;
      var list = __tcListOf(actual);
      if (list === null) return null;
      return Array.prototype.indexOf.call(list, needle) !== -1 || (needle !== needle && list.some(function(v) { return v !== v; }));
    }
    return {
      toBe: function(expected) {
        if (actual === expected) return;
        if (__tcHasNumber(expected)) fail(__tcNumberMiss(actual, expected));
        fail('Expected ' + __tcShow(expected) + ' but got ' + __tcShow(actual) + '.');
      },
      toEqual: function(expected) {
        if (JSON.stringify(actual) === JSON.stringify(expected)) return;
        if (__tcHasNumber(expected)) fail(__tcNumberMiss(actual, expected));
        fail('Expected ' + __tcShow(expected) + ' but got ' + __tcShow(actual) + '.');
      },
      toBeDefined: function() {
        if (actual === undefined || actual === null) {
          fail('Nothing came back here: the value is ' + String(actual) + '.');
        }
      },
      toBeNull: function() {
        if (actual !== null) fail('Expected null, got ' + __tcNamed(actual) + '.');
      },
      toBeTruthy: function() {
        if (!actual) fail('Expected a truthy value, got ' + __tcShow(actual) + '.');
      },
      toBeFalsy: function() {
        if (actual) fail('Expected a falsy value, got ' + __tcShow(actual) + '.');
      },
      toBeGreaterThan: function(expected) {
        if (!(actual > expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires a value greater than ' + __tcShow(expected) + '.');
        }
      },
      toBeLessThan: function(expected) {
        if (!(actual < expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires a value less than ' + __tcShow(expected) + '.');
        }
      },
      toBeGreaterThanOrEqual: function(expected) {
        if (!(actual >= expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires at least ' + __tcShow(expected) + '.');
        }
      },
      toBeLessThanOrEqual: function(expected) {
        if (!(actual <= expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires at most ' + __tcShow(expected) + '.');
        }
      },
      toContain: function(expected) {
        var inside = contains(expected);
        if (inside === null) {
          fail('toContain needs a string or a list, got ' + __tcType(actual) + '.');
        }
        if (inside) return;
        if (typeof actual === 'string') {
          fail('Your text does not contain ' + __tcShow(expected) + '. Yours: ' + __tcShow(actual) + '.');
        }
        if (__tcHasNumber(expected)) {
          fail('Your list is missing a value this check requires. Yours: ' + __tcShow(actual) + '.');
        }
        fail('Your list does not contain ' + __tcShow(expected) + '. Yours: ' + __tcShow(actual) + '.');
      },
      toHaveLength: function(expected) {
        if (actual == null || typeof actual.length !== 'number') {
          fail('Got ' + __tcNamed(actual) + ', which has no length.');
        }
        if (actual.length !== expected) {
          fail('Your value has length ' + actual.length + '; ' + expected + ' was required.');
        }
      },
      toThrow: function(expected) {
        if (typeof actual !== 'function') {
          fail('toThrow needs a function to call, got ' + __tcType(actual) + '.');
        }
        var threw = false;
        var caught = null;
        try { actual(); } catch (e) { threw = true; caught = e; }
        if (!threw) fail('This call was required to throw, and it returned instead.');
        if (expected !== undefined) {
          var msg = caught && caught.message ? String(caught.message) : String(caught);
          var ok = __tcIsRe(expected) ? expected.test(msg) : msg.indexOf(String(expected)) !== -1;
          if (!ok) {
            fail('It threw, but the message was ' + __tcShow(msg) + ' and this check requires ' + __tcShow(String(expected)) + '.');
          }
        }
      },
      toBeCloseTo: function(expected, precision) {
        var p = precision === undefined ? __tcDefaultPrecision() : precision;
        var limit = Math.pow(10, -p) / 2;
        var diff = Math.abs(actual - expected);
        // NaN-safe: a non-numeric actual makes diff NaN, and NaN < limit is
        // false, so the negated form fails instead of silently passing.
        if (diff < limit) return;
        if (typeof actual !== 'number') {
          fail('Got ' + __tcNamed(actual) + ' where a number was required.');
        }
        if (actual !== actual) fail('Got NaN, so the calculation produced no number.');
        fail('Got ' + actual + ', which is too ' + (actual > expected ? 'high' : 'low') + '. This check allows a difference of at most ' + __tcTolerance(p) + ' (precision ' + p + ').');
      },
      toHaveProperty: function(key, expected) {
        var path = String(key).split('.');
        var cur = actual;
        for (var i = 0; i < path.length; i++) {
          var reachable = cur !== null && (typeof cur === 'object' || typeof cur === 'function');
          if (!reachable || !(path[i] in cur)) {
            fail('Expected a property named ' + __tcShow(key) + ', which is not there.');
          }
          cur = cur[path[i]];
        }
        if (arguments.length > 1 && JSON.stringify(cur) !== JSON.stringify(expected)) {
          if (__tcHasNumber(expected)) fail('Property ' + key + ': ' + __tcNumberMiss(cur, expected));
          fail('Property ' + key + ' expected ' + __tcShow(expected) + ' but got ' + __tcShow(cur) + '.');
        }
      },
      toMatch: function(pattern) {
        var s = String(actual);
        var ok = __tcIsRe(pattern) ? pattern.test(s) : s.indexOf(String(pattern)) !== -1;
        if (!ok) {
          fail('Your text does not match ' + (__tcIsRe(pattern) ? String(pattern) : __tcShow(String(pattern))) + '. Yours: ' + __tcShow(s) + '.');
        }
      },
      toMatchObject: function(expected) {
        function match(a, e) {
          if (e === null || typeof e !== 'object') return a === e;
          if (Array.isArray(e)) {
            if (!Array.isArray(a) || a.length < e.length) return false;
            for (var i = 0; i < e.length; i++) if (!match(a[i], e[i])) return false;
            return true;
          }
          for (var k in e) if (!match(a && a[k], e[k])) return false;
          return true;
        }
        if (!match(actual, expected)) {
          fail('Your object does not carry the required fields. Yours: ' + __tcShow(actual) + '.');
        }
      },
      toBeInstanceOf: function(ctor) {
        if (!(actual instanceof ctor)) {
          fail('Expected an instance of ' + String(ctor && ctor.name) + ', got ' + __tcType(actual) + '.');
        }
      },
      toHaveBeenCalled: function() {
        if (!actual || !actual.mock || actual.mock.calls.length === 0) {
          fail('This function was never called.');
        }
      },
      toHaveBeenCalledTimes: function(n) {
        if (!actual || !actual.mock) fail('Expected a mock function here.');
        if (actual.mock.calls.length !== n) {
          fail('This function was called ' + actual.mock.calls.length + ' time(s); ' + n + ' was required.');
        }
      },
      toHaveBeenCalledWith: function() {
        if (!actual || !actual.mock) fail('Expected a mock function here.');
        var expectedArgs = Array.prototype.slice.call(arguments);
        var ok = actual.mock.calls.some(function(c) {
          return JSON.stringify(c) === JSON.stringify(expectedArgs);
        });
        if (!ok) {
          fail('No call matched the required arguments. Calls seen: ' + __tcShow(actual.mock.calls) + '.');
        }
      },
      resolves: {
        toBe: function(expected) {
          return Promise.resolve(actual).then(function(v) {
            return __tcMatchers(v, __why).toBe(expected);
          });
        },
        toEqual: function(expected) {
          return Promise.resolve(actual).then(function(v) {
            return __tcMatchers(v, __why).toEqual(expected);
          });
        },
      },
      rejects: {
        toThrow: function(msgOrRegex) {
          if (!actual || typeof actual.then !== 'function') {
            fail('Expected a promise here, got ' + __tcType(actual) + '.');
          }
          return actual.then(
            function() { fail('This promise was required to reject, and it resolved instead.'); },
            function(err) {
              if (msgOrRegex === undefined || msgOrRegex === null) return;
              var msg = (err && err.message) || String(err);
              var ok = __tcIsRe(msgOrRegex) ? msgOrRegex.test(msg) : msg.indexOf(String(msgOrRegex)) !== -1;
              if (!ok) {
                fail('It rejected, but the message was ' + __tcShow(msg) + ' and this check requires ' + __tcShow(String(msgOrRegex)) + '.');
              }
            }
          );
        },
        toEqual: function(expected) {
          if (!actual || typeof actual.then !== 'function') {
            fail('Expected a promise here, got ' + __tcType(actual) + '.');
          }
          return actual.then(
            function() { fail('This promise was required to reject, and it resolved instead.'); },
            function(err) { return __tcMatchers(err, __why).toEqual(expected); }
          );
        },
      },
      not: {
        toBe: function(expected) {
          if (actual === expected) fail('This value must not be ' + __tcShow(expected) + ', and it is.');
        },
        toEqual: function(expected) {
          if (JSON.stringify(actual) === JSON.stringify(expected)) {
            fail('This value must not equal ' + __tcShow(expected) + ', and it does.');
          }
        },
        toBeDefined: function() {
          if (actual !== undefined && actual !== null) {
            fail('This value must be undefined, and it is ' + __tcShow(actual) + '.');
          }
        },
        toBeNull: function() {
          if (actual === null) fail('This value must not be null, and it is.');
        },
        toBeTruthy: function() {
          if (actual) fail('This value must be falsy, and it is ' + __tcShow(actual) + '.');
        },
        toBeFalsy: function() {
          if (!actual) fail('This value must be truthy, and it is ' + __tcShow(actual) + '.');
        },
        toContain: function(expected) {
          if (contains(expected) === true) {
            fail('Your value must not contain ' + __tcShow(expected) + ', and it does.');
          }
        },
        toMatch: function(pattern) {
          var s = String(actual);
          var matched = __tcIsRe(pattern) ? pattern.test(s) : s.indexOf(String(pattern)) !== -1;
          if (matched) {
            fail('Your text must not match ' + (__tcIsRe(pattern) ? String(pattern) : __tcShow(String(pattern))) + ', and it does.');
          }
        },
        toHaveProperty: function(key) {
          var path = String(key).split('.');
          var cur = actual;
          for (var i = 0; i < path.length; i++) {
            var reachable = cur !== null && (typeof cur === 'object' || typeof cur === 'function');
            if (!reachable || !(path[i] in cur)) return;
            cur = cur[path[i]];
          }
          fail('This value must not have a property named ' + __tcShow(key) + ', and it does.');
        },
        toHaveBeenCalled: function() {
          if (actual && actual.mock && actual.mock.calls.length > 0) {
            fail('This function must not have been called, and it was called ' + actual.mock.calls.length + ' time(s).');
          }
        },
        toBeCloseTo: function(expected, precision) {
          var p = precision === undefined ? __tcDefaultPrecision() : precision;
          var limit = Math.pow(10, -p) / 2;
          if (Math.abs(actual - expected) < limit) {
            fail('This value must not sit within ' + __tcTolerance(p) + ' of that target, and it does.');
          }
        },
      },
    };
  }

  function expect(actual, why) {
    return __tcMatchers(actual, why);
  }
  __tcInstallStatics(expect);
  var jest = __tcJest();
  /* --- end shared-assertions --- */
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
        relu: function() { return _tf.relu(this); },
        sigmoid: function() { return _tf.sigmoid(this); },
        tanh: function() { return _tf.tanh(this); },
        softmax: function() { return _tf.softmax(this); },
        neg: function() { return _tf.neg(this); },
        pow: function(e) { return _tf.pow(this, e); },
        square: function() { return _tf.pow(this, 2); },
        matMul: function(other) { return _tf.matMul(this, other); },
        dot: function(other) { return _tf.dot(this, other); },
        transpose: function() {
          if (s.length !== 2) return makeTensor(Array.from(flat), s);
          var rows = s[0], cols = s[1];
          var out = new Array(rows * cols);
          for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
              out[j * rows + i] = flat[i * cols + j];
            }
          }
          return makeTensor(out, [cols, rows]);
        },
        slice: function(begin, size) {
          var b = Array.isArray(begin) ? begin[0] : begin;
          var sz = Array.isArray(size) ? size[0] : (size !== undefined ? size : flat.length - b);
          return makeTensor(Array.from(flat.slice(b, b + sz)), [sz]);
        },
        clone: function() { return makeTensor(Array.from(flat), s.slice()); },
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
      dot: function(a, b) {
        var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
        // 1D ⋅ 1D → scalar
        if (a.shape.length === 1 && b.shape.length === 1) {
          if (ad.length !== bd.length) {
            throw new Error('dot: vector lengths must match: ' + ad.length + ' vs ' + bd.length);
          }
          var s = 0;
          for (var i = 0; i < ad.length; i++) s += ad[i] * bd[i];
          return _tf.tensor([s], []);
        }
        // 2D ⋅ 2D → matMul; 2D ⋅ 1D → matrix-vector
        if (a.shape.length === 2 && b.shape.length === 1) {
          var M = a.shape[0], K = a.shape[1];
          if (K !== bd.length) {
            throw new Error('dot: inner dimensions must match: [' + a.shape + '] vs [' + b.shape + ']');
          }
          var out = [];
          for (var i = 0; i < M; i++) {
            var s = 0;
            for (var k = 0; k < K; k++) s += ad[i * K + k] * bd[k];
            out.push(s);
          }
          return _tf.tensor(out, [M]);
        }
        return _tf.matMul(a, b);
      },
      stack: function(tensors, axis) {
        axis = axis || 0;
        var shape0 = tensors[0].shape;
        var allData = [];
        for (var i = 0; i < tensors.length; i++) {
          allData = allData.concat(Array.from(tensors[i].dataSync()));
        }
        return _tf.tensor(allData, [tensors.length].concat(shape0));
      },
      unstack: function(t, axis) {
        axis = axis || 0;
        var rows = t.shape[0];
        var rest = t.shape.slice(1);
        var stride = rest.reduce(function(a,b){return a*b;},1);
        var d = Array.from(t.dataSync());
        var out = [];
        for (var i = 0; i < rows; i++) {
          out.push(_tf.tensor(d.slice(i * stride, (i + 1) * stride), rest));
        }
        return out;
      },
      keep: function(x) { return x; },
      tidy: function(name, fn) {
        if (typeof name === 'function') { fn = name; }
        return fn();
      },
      variable: function(initial) {
        // A variable is just a tensor with mutable .assign(), proxy all tensor methods.
        var t = initial;
        var v = Object.assign({}, t, {
          assign: function(newVal) {
            t = newVal;
            // Re-bind tensor methods to the new underlying tensor.
            Object.keys(newVal).forEach(function(k) { v[k] = newVal[k]; });
          },
          dispose: function() {},
        });
        return v;
      },
      losses: {
        meanSquaredError: function(yTrue, yPred) {
          var a = Array.from(yTrue.dataSync()), b = Array.from(yPred.dataSync());
          var s = 0;
          for (var i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i]);
          return _tf.tensor([s / a.length], []);
        },
        sigmoidCrossEntropy: function(labels, logits) {
          var a = Array.from(labels.dataSync()), b = Array.from(logits.dataSync());
          var s = 0;
          for (var i = 0; i < a.length; i++) {
            var p = 1 / (1 + Math.exp(-b[i]));
            var c = Math.max(p, 1e-9), d = Math.max(1 - p, 1e-9);
            s += -(a[i] * Math.log(c) + (1 - a[i]) * Math.log(d));
          }
          return _tf.tensor([s / a.length], []);
        },
      },
      train: {
        adam: function(lr) { return { name: 'adam', learningRate: lr || 0.001, applyGradients: function(){}, minimize: function(fn){ return fn(); } }; },
        sgd: function(lr) { return { name: 'sgd', learningRate: lr || 0.01, applyGradients: function(){}, minimize: function(fn){ return fn(); } }; },
        rmsprop: function(lr) { return { name: 'rmsprop', learningRate: lr || 0.001, applyGradients: function(){}, minimize: function(fn){ return fn(); } }; },
      },
      grad: function(fn) {
        return function(x) {
          // Numeric gradient via central difference
          var h = 1e-4;
          var xp = _tf.add(x, _tf.tensor([h], x.shape));
          var xm = _tf.sub(x, _tf.tensor([h], x.shape));
          var fp = fn(xp), fm = fn(xm);
          return _tf.div(_tf.sub(fp, fm), _tf.tensor([2 * h], fp.shape));
        };
      },
      grads: function(fn) {
        return function(args) {
          var h = 1e-4;
          var grads = args.map(function(arg, i) {
            var ap = args.slice(); var am = args.slice();
            ap[i] = _tf.add(arg, _tf.tensor([h], arg.shape));
            am[i] = _tf.sub(arg, _tf.tensor([h], arg.shape));
            var fp = fn.apply(null, ap), fm = fn.apply(null, am);
            return _tf.div(_tf.sub(fp, fm), _tf.tensor([2 * h], fp.shape));
          });
          return { value: fn.apply(null, args), grads: grads };
        };
      },
      variableGrads: function(fn) {
        var v = fn();
        return { value: v, grads: {} };
      },
      valueAndGrad: function(fn) {
        var grad = _tf.grad(fn);
        return function(x) { return { value: fn(x), grad: grad(x) }; };
      },
      memory: function() { return { numTensors: 0, numBytes: 0 }; },
      backend: function() { return 'cpu'; },
      setBackend: function() { return Promise.resolve(true); },
      ready: function() { return Promise.resolve(); },
      env: function() { return { set: function(){}, get: function(){ return undefined; } }; },
      browser: { fromPixels: function() { return _tf.zeros([1, 1, 3]); } },
      io: { browserHTTPRequest: function() { return {}; } },
      loadLayersModel: function() {
        return Promise.resolve(_tf.sequential());
      },
      loadGraphModel: function() {
        return Promise.resolve({
          predict: function(x) { return _tf.zeros(x.shape); },
          execute: function(x) { return _tf.zeros(x.shape); },
          dispose: function() {},
        });
      },
      sequential: function() {
        var layers = [];
        var compiledOptimizer = null;
        var compiledLoss = null;
        var compiledMetrics = null;
        var model = {
          add: function(layer) { layers.push(layer); },
          compile: function(config) {
            config = config || {};
            // Resolve string-named optimizer to the train.* factory output.
            if (typeof config.optimizer === 'string') {
              var factory = _tf.train[config.optimizer];
              compiledOptimizer = factory ? factory() : { name: config.optimizer };
            } else if (config.optimizer) {
              compiledOptimizer = config.optimizer;
            } else {
              compiledOptimizer = null;
            }
            compiledLoss = config.loss || null;
            compiledMetrics = config.metrics || null;
            this.optimizer = compiledOptimizer;
            this.loss = compiledLoss;
            this.metrics = compiledMetrics;
          },
          fit: function(x, y, opts) {
            var epochs = (opts && opts.epochs) || 3;
            var lossHistory = [];
            for (var i = 0; i < epochs; i++) {
              lossHistory.push(0.5 * Math.pow(0.7, i));
            }
            return Promise.resolve({ history: { loss: lossHistory } });
          },
          predict: function(x) {
            var batchSize = x.shape[0];
            var lastUnits = layers.length > 0 && layers[layers.length-1].units ? layers[layers.length-1].units : 1;
            return _tf.zeros([batchSize, lastUnits]);
          },
          evaluate: function(x, y, opts) {
            return _tf.tensor([0.0], []);
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
          getWeights: function() { return []; },
          setWeights: function() {},
          countParams: function() {
            var total = 0;
            for (var i = 0; i < layers.length; i++) {
              if (layers[i].units) total += layers[i].units * (layers[i].units + 1);
              if (layers[i].filters && layers[i].kernelSize) {
                var k = Array.isArray(layers[i].kernelSize) ? layers[i].kernelSize[0] : layers[i].kernelSize;
                total += layers[i].filters * (k * k * 3 + 1);
              }
            }
            return total;
          },
          save: function() { return Promise.resolve({}); },
          dispose: function() {},
          layers: layers,
        };
        // Define outputShape as a getter so it reflects layers added after construction.
        Object.defineProperty(model, 'outputShape', {
          get: function() {
            if (layers.length === 0) return null;
            var last = layers[layers.length - 1];
            if (last.units) return [null, last.units];
            if (last.type === 'flatten') return [null, null];
            return [null];
          },
        });
        Object.defineProperty(model, 'inputShape', {
          get: function() {
            if (layers.length === 0) return null;
            var first = layers[0];
            return first.inputShape ? [null].concat(first.inputShape) : null;
          },
        });
        return model;
      },
      model: function(config) { return _tf.sequential(); },
      layers: {
        dense: function(config) { return { units: config.units, activation: config.activation || 'linear', inputShape: config.inputShape, type: 'dense' }; },
        dropout: function(config) { return { rate: config.rate, type: 'dropout' }; },
        flatten: function() { return { type: 'flatten' }; },
        conv2d: function(config) { return { filters: config.filters, kernelSize: config.kernelSize, activation: config.activation || 'linear', inputShape: config.inputShape, type: 'conv2d' }; },
        maxPooling2d: function(config) { return { poolSize: config && config.poolSize, type: 'maxPooling2d' }; },
        averagePooling2d: function(config) { return { poolSize: config && config.poolSize, type: 'averagePooling2d' }; },
        embedding: function(config) { return { inputDim: config.inputDim, outputDim: config.outputDim, type: 'embedding' }; },
        lstm: function(config) { return { units: config.units, returnSequences: config.returnSequences, type: 'lstm' }; },
        gru: function(config) { return { units: config.units, returnSequences: config.returnSequences, type: 'gru' }; },
        simpleRNN: function(config) { return { units: config.units, returnSequences: config.returnSequences, type: 'simpleRNN' }; },
        batchNormalization: function() { return { type: 'batchNormalization' }; },
        layerNormalization: function() { return { type: 'layerNormalization' }; },
        bidirectional: function(config) {
          var inner = config && config.layer ? config.layer : { type: 'unknown' };
          var u = inner.units ? inner.units * 2 : undefined;
          return { units: u, type: 'bidirectional', layer: inner };
        },
        timeDistributed: function(config) {
          var inner = config && config.layer ? config.layer : { type: 'unknown' };
          return { units: inner.units, type: 'timeDistributed', layer: inner };
        },
        globalAveragePooling1d: function() { return { type: 'globalAveragePooling1d' }; },
        globalAveragePooling2d: function() { return { type: 'globalAveragePooling2d' }; },
        globalMaxPooling1d: function() { return { type: 'globalMaxPooling1d' }; },
        globalMaxPooling2d: function() { return { type: 'globalMaxPooling2d' }; },
        upSampling2d: function(config) { return { type: 'upSampling2d', size: config && config.size }; },
        zeroPadding2d: function(config) { return { type: 'zeroPadding2d', padding: config && config.padding }; },
        depthwiseConv2d: function(config) { return { type: 'depthwiseConv2d', kernelSize: config.kernelSize, activation: config.activation }; },
        separableConv2d: function(config) { return { type: 'separableConv2d', filters: config.filters, kernelSize: config.kernelSize, activation: config.activation }; },
        conv1d: function(config) { return { filters: config.filters, kernelSize: config.kernelSize, activation: config.activation, type: 'conv1d' }; },
        maxPooling1d: function(config) { return { type: 'maxPooling1d', poolSize: config && config.poolSize }; },
        averagePooling1d: function(config) { return { type: 'averagePooling1d', poolSize: config && config.poolSize }; },
        reshape: function(config) { return { type: 'reshape', targetShape: config && config.targetShape }; },
        repeatVector: function(config) { return { type: 'repeatVector', n: config && config.n }; },
        permute: function(config) { return { type: 'permute', dims: config && config.dims }; },
        activation: function(config) { return { type: 'activation', activation: config && config.activation }; },
        leakyReLU: function(config) { return { type: 'leakyReLU', alpha: config && config.alpha }; },
        elu: function(config) { return { type: 'elu', alpha: config && config.alpha }; },
        gaussianNoise: function(config) { return { type: 'gaussianNoise', stddev: config && config.stddev }; },
        spatialDropout1d: function(config) { return { type: 'spatialDropout1d', rate: config && config.rate }; },
        add: function() { return { type: 'add' }; },
        concatenate: function() { return { type: 'concatenate' }; },
        multiply: function() { return { type: 'multiply' }; },
      },
    };

    return _tf;
  })();
`;

import { stripTypeScript } from "./strip-typescript";
export { stripTypeScript };

// --- shared-user-syntax-check: kept byte-identical (modulo whitespace and
// comments) between packages/ui/src/mdx/exercise-runner.ts and
// scripts/validate-exercises.mjs, and compared by assertHarnessParity().
//
// Both harnesses concatenate the learner's code and the test code into ONE
// function body. An unbalanced brace in the learner's function therefore
// swallows the harness that follows it, and the run dies with a message
// about code the learner never wrote: dropping one closing brace in
// implement-neuron used to report "await is only valid in async functions
// and the top level bodies of modules" under the name "Code execution",
// while the results list vanished (completeness critic, 2026-09-08).
// Parsing the learner's code ALONE, first, lets the failure name the real
// cause. The wrapper matches how each harness runs the submission, so a
// top-level await stays legal.
function userCodeSyntaxError(cleanUserCode = "") {
  try {
    new Function("return (async function() {\n" + cleanUserCode + "\n});");
    return null;
  } catch (err) {
    // Object() so the read type-checks in the .ts copy, where a catch
    // binding is unknown.
    const raised = Object(err);
    return typeof raised.message === "string" ? raised.message : String(err);
  }
}

function userSyntaxErrorResult(parserMessage = "") {
  return {
    name: "Your code has a syntax error",
    passed: false,
    error:
      "JavaScript could not parse your code, so no test ran. The parser said: " +
      parserMessage +
      ". An unclosed or extra brace is the usual cause: check that every opening brace has a partner.",
  };
}
// --- end shared-user-syntax-check ---

function buildFullCode(userCode: string, testCode: string): string {
  const cleanCode = stripTypeScript(userCode);
  // testCode is authored in TS too (annotations, `as` casts) - strip it with
  // the same tokenizer or the whole bundle SyntaxErrors at runtime.
  const cleanTestCode = stripTypeScript(testCode);
  // The worker injects real `tf` as a function param; no inline mock.
  // Wrap user code so top-level `await` works.
  return `${HARNESS}\nreturn (async function() {\n${cleanCode}\n${cleanTestCode}\nawait __awaitPending();\nreturn __results;\n})();`;
}

// Worker body. Loads real @tensorflow/tfjs (Node: require, Browser: CDN
// importScripts) and exposes it as global `tf`, replacing the prior hand-
// rolled mock. This delivers genuine semantics for predict/fit/grad and
// closes the long tail of "is not a function" errors driven by mock gaps.
const WORKER_BODY = `
  var createFitRecorder = ${FIT_RECORDING_SOURCE};
  var fitRecorder;
(function() {
  // Seal Math.random before anything else runs (round 7, 2026-09-13). The
  // grader's run-time draws and tf's own generator both read it, so a
  // submission that reassigned it turned every drawn fixture into a constant.
  // Per-run seed from the original generator, then the property is made
  // non-writable and non-configurable: a reassignment is ignored in sloppy
  // code and throws in strict code. The Math binding itself is locked the
  // same way, since globalThis.Math = copyWithRandomPinned walked around
  // the property seal (round 7b, 2026-09-14). Mirrors sealedMath() and the
  // host lock in scripts/validate-exercises.mjs.
  (function() {
    var seed = (Math.random() * 0x100000000) >>> 0;
    var random = function() {
      seed = (seed + 0x6d2b79f5) >>> 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    try { Object.defineProperty(Math, 'random', { value: random, writable: false, configurable: false }); } catch (e) {}
    try { Object.defineProperty(globalThis, 'Math', { value: Math, writable: false, configurable: false }); } catch (e) {}
  })();
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

  // Load real @tensorflow/tfjs into global scope as 'tf'.
  var tfReady;
  if (isNode) {
    try {
      globalThis.tf = require('@tensorflow/tfjs');
      tfReady = Promise.resolve();
    } catch (e) {
      tfReady = Promise.reject(new Error('Failed to load @tensorflow/tfjs in Node worker: ' + e.message));
    }
  } else {
    try {
      // Same-origin vendored copy first (no CDN dependency, no third-party
      // CSP entry needed; version-locked to the grader's node_modules copy).
      // Blob workers inherit the page origin, so self.location.origin
      // resolves to the app host.
      importScripts(self.location.origin + '/vendor/tfjs-4.22.0.min.js');
      tfReady = Promise.resolve();
    } catch (eLocal) {
      try {
        importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
        tfReady = Promise.resolve();
      } catch (e) {
        tfReady = Promise.reject(new Error('Failed to importScripts TFJS in worker (local: ' + eLocal.message + '; cdn: ' + e.message + ')'));
      }
    }
  }

  // Tell the host the runtime is up. The host uses this to stop measuring
  // download time against the learner's execution budget: importScripts above
  // pulls a ~1.4 MB bundle, which on a slow connection alone exceeds the 10s
  // timeout and produced "Timed out after 10 seconds" for code that never ran.
  // Resolution (not rejection) is what matters here - a failed load is
  // reported through the normal error path when the run is attempted.
  try {
    Promise.resolve(tfReady).then(function () {
      post({ ready: true });
    }, function () {});
  } catch (e) {}

  // Lesson-test compatibility shims. Real TFJS is the source of truth, but a
  // handful of lesson tests assume API niceties that TFJS doesn't expose
  // directly (model.inputShape on sequential models, network-loadable
  // models, ONNX runtime global, performance.mark in workers). These shims
  // close the gap without weakening grader truthfulness.
  function applyShims() {
    var tf = globalThis.tf;
    if (!tf) return;
    if (!fitRecorder) fitRecorder = createFitRecorder(tf);

    // Part of the call spy above: tensor METHODS (a.add(b), x.matMul(w),
    // t.sum().dataSync()) are prototype calls the proxy cannot see, so the
    // prototype is patched once and counts into the run's live counter object
    // as 'tensor.<name>'. A grader that exists to teach a tensor op reads
    // these; the CI validator patches the same list.
    var TENSOR_METHODS = ['add', 'sub', 'mul', 'div', 'matMul', 'dot', 'transpose', 'sum', 'mean', 'square', 'sqrt', 'max', 'min', 'argMax', 'norm', 'exp', 'log', 'sigmoid', 'softmax', 'reshape', 'concat', 'dataSync', 'data', 'arraySync', 'dispose'];
    if (tf.Tensor && tf.Tensor.prototype && !tf.Tensor.prototype.__tcSpied) {
      TENSOR_METHODS.forEach(function(name) {
        var real = tf.Tensor.prototype[name];
        if (typeof real !== 'function') return;
        tf.Tensor.prototype[name] = function() {
          var c = globalThis.__tcCalls;
          if (c) c['tensor.' + name] = (c['tensor.' + name] || 0) + 1;
          return real.apply(this, arguments);
        };
      });
      tf.Tensor.prototype.__tcSpied = true;
    }
    if (tf.LayersModel && tf.LayersModel.prototype && !tf.LayersModel.prototype.__tcSpied) {
      var realSave = tf.LayersModel.prototype.save;
      tf.LayersModel.prototype.save = function() {
        var c = globalThis.__tcCalls;
        if (c) c['model.save'] = (c['model.save'] || 0) + 1;
        return realSave.apply(this, arguments);
      };
      // One count per predict call, Sequential or functional; same rule as
      // the validator.
      var realPredict = tf.LayersModel.prototype.predict;
      tf.LayersModel.prototype.predict = function() {
        var c = globalThis.__tcCalls;
        if (c) c['model.predict'] = (c['model.predict'] || 0) + 1;
        return realPredict.apply(this, arguments);
      };
      tf.LayersModel.prototype.fit = fitRecorder.wrap(tf.LayersModel.prototype.fit);
      tf.LayersModel.prototype.__tcSpied = true;
    }
    // Lock the spied methods and the read path after the spy has wrapped
    // them, and freeze tf.util: the namespace proxy refuses writes to tf's
    // own properties, but tf.Tensor.prototype.arraySync = () => 'P' poisoned
    // every grader's read path before this (round 7b, 2026-09-14). Identical
    // block in the validator.
    (function() {
      function lockMethods(target, names) {
        if (!target) return;
        names.forEach(function(name) {
          var d = Object.getOwnPropertyDescriptor(target, name);
          if (d && typeof d.value === 'function' && d.configurable) {
            d.writable = false; d.configurable = false;
            Object.defineProperty(target, name, d);
          }
        });
      }
      lockMethods(tf.Tensor && tf.Tensor.prototype, TENSOR_METHODS.concat(['data', 'array', 'dataSync', 'arraySync']));
      lockMethods(tf.LayersModel && tf.LayersModel.prototype, ['predict', 'save', 'fit']);
      if (tf.util && typeof tf.util === 'object') { try { Object.freeze(tf.util); } catch (e) {} }
    })();

    // The tf namespace is frozen, so we can't reassign tf.sequential or
    // tf.loadLayersModel. Patch the Sequential prototype + intercept via
    // Function.prototype-style replacement by creating a fresh sequential
    // factory and re-binding it through a Proxy-like approach that the
    // exercise code uses indirectly via tf access.

    // 1. Patch LayersModel + Sequential + Container prototypes to expose
    //    inputShape derived from inputs/layers (real TFJS leaves this
    //    undefined). Sequential extends LayersModel extends Container, so
    //    walk the chain and patch each level once.
    try {
      var sampleSeq = tf.sequential();
      sampleSeq.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      var protos = [];
      var p = sampleSeq;
      while (p && p !== Object.prototype) {
        var proto = Object.getPrototypeOf(p);
        if (!proto || proto === Object.prototype) break;
        if (protos.indexOf(proto) === -1) protos.push(proto);
        p = proto;
      }
      protos.forEach(function(proto) {
        if (!Object.getOwnPropertyDescriptor(proto, 'inputShape')) {
          Object.defineProperty(proto, 'inputShape', {
            configurable: true,
            get: function() {
              if (this.inputs && this.inputs[0]) return this.inputs[0].shape;
              var first = this.layers && this.layers[0];
              return first && first.batchInputShape;
            },
          });
        }
      });
      sampleSeq.dispose && sampleSeq.dispose();
    } catch (e) { /* ignore */ }

    // 2. tf.loadLayersModel can't reach the network from a worker. Stub it
    //    to return a model whose architecture is DERIVED FROM THE URL, so
    //    lessons that load a saved model still pass shape and metadata
    //    assertions while no submission can clear one by hardcoding a
    //    memorised shape triple. Before 2026-09-08 this returned a fixed
    //    4 -> 8 -> 1 stack while the CI validator returned a fixed
    //    10 -> 8 -> 4 one, so the same hardcode passed in one harness and
    //    failed in the other.

    // --- stub-arch-derivation: kept byte-identical (modulo whitespace) with
    // the copy in scripts/validate-exercises.mjs, whose assertHarnessParity()
    // reads this block out of this file and fails CI if the two drift. ---
    function stubArchFromUrl(url) {
      // FNV-1a over the url, via Math.imul so the 32-bit multiply stays exact.
      var h = 0x811c9dc5;
      var s = String(url == null ? "" : url);
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      var inputDim = 4 + (h % 13);
      var hidden = 4 + ((h >>> 5) % 13);
      var outputUnits = 1 + ((h >>> 11) % 4);
      var deep = (h >>> 17) % 2 === 1;
      return {
        inputDim: inputDim,
        hidden: hidden,
        outputUnits: outputUnits,
        hiddenTwo: deep ? Math.max(2, hidden >> 1) : 0,
        layerCount: deep ? 3 : 2,
      };
    }
    // --- end stub-arch-derivation ---

    function stubLoadLayers(url) {
      var a = stubArchFromUrl(url);
      var stub = tf.sequential();
      stub.add(tf.layers.dense({ units: a.hidden, activation: 'relu', inputShape: [a.inputDim] }));
      if (a.hiddenTwo) {
        stub.add(tf.layers.dense({ units: a.hiddenTwo, activation: 'relu' }));
      }
      stub.add(tf.layers.dense({
        units: a.outputUnits,
        activation: a.outputUnits === 1 ? 'sigmoid' : 'softmax',
      }));
      return Promise.resolve(stub);
    }
    function stubLoadGraph(url) {
      var a = stubArchFromUrl(url);
      var layers = [];
      for (var i = 0; i < a.layerCount; i++) layers.push({});
      function out(x) {
        var batch = (x && x.shape && x.shape[0]) || 1;
        return tf.zeros([batch, a.outputUnits]);
      }
      return Promise.resolve({
        predict: out,
        execute: out,
        inputs: [{ shape: [null, a.inputDim] }],
        outputs: [{ shape: [null, a.outputUnits] }],
        layers: layers,
        dispose: function() {},
      });
    }
    // tf exports are non-writable + non-configurable read-only ESM
    // bindings, so direct assign and defineProperty both fail. Stash the
    // stubs on globalThis; the worker passes them via a Proxy wrapper
    // (built below the shim) as the tf argument to user code.
    globalThis.__tcStubs = {
      loadLayersModel: stubLoadLayers,
      loadGraphModel: stubLoadGraph,
    };

    // (Removed earlier InputSpec.shape getter, conflicted with TFJS's
    // own writes to spec.shape on subclasses. Lessons that read
    // layer.inputSpec[0].shape[N] are corrected at the lesson level via
    // the tests-fix script instead.)

    // ONNX runtime global stub for lessons that compare TFJS vs ORT. The
    // session output is a function of the feed, not a constant, so an
    // exercise can grade the number a solution returns instead of only
    // spying on the call.

    // --- stub-onnx-derivation: kept byte-identical (modulo whitespace) with
    // the copy in scripts/validate-exercises.mjs, whose assertHarnessParity()
    // reads this block out of this file and fails CI if the two drift. ---
    function stubOnnxScore(feeds) {
      // Squash a position-weighted sum of the feed values into (0, 1). Any
      // deterministic function of the input works; what matters is that it IS a
      // function of the input, so returning a memorised constant is a wrong
      // answer. Before 2026-09-08 both shims returned 0.5 for every feed, which
      // made a plain "return 0.5" indistinguishable from running the session.
      var key = feeds ? Object.keys(feeds)[0] : null;
      var t = key ? feeds[key] : null;
      var data = t && t.data ? t.data : [];
      var acc = 0;
      for (var i = 0; i < data.length; i++) acc += (i + 1) * Number(data[i]);
      return 1 / (1 + Math.exp(-acc));
    }
    // --- end stub-onnx-derivation ---

    if (typeof globalThis.ort === 'undefined') {
      globalThis.ort = {
        InferenceSession: {
          create: function() {
            return Promise.resolve({
              inputNames: ['input'],
              outputNames: ['output'],
              run: function(feeds) {
                return Promise.resolve({
                  output: {
                    data: new Float32Array([stubOnnxScore(feeds)]),
                    dims: [1, 1],
                  },
                });
              },
              // Lifecycle no-ops the real library exposes (lesson 5 tells the
              // reader to release the session); kept in step with the
              // validator's stub.
              release: function() { return Promise.resolve(); },
            });
          },
        },
        Tensor: function(type, data, dims) { this.type = type; this.data = data; this.dims = dims; this.dispose = function() {}; },
      };
    }

    // performance.mark / measure shim, real perf API exists in Node 16+ but
    // some lessons mark from inside flagged code paths that don't run during
    // grading. Provide a relaxed implementation that always returns a measure.
    if (typeof globalThis.performance === 'undefined') globalThis.performance = {};
    var perf = globalThis.performance;
    var marks = {};
    var origMark = perf.mark;
    var origMeasure = perf.measure;
    perf.mark = function(name) {
      marks[name] = (typeof perf.now === 'function' ? perf.now() : Date.now());
      if (origMark) try { return origMark.call(perf, name); } catch (e) {}
    };
    perf.measure = function(name, start, end) {
      if (origMeasure) {
        try { return origMeasure.call(perf, name, start, end); } catch (e) {}
      }
      var s = marks[start] || 0;
      var e = marks[end] || (typeof perf.now === 'function' ? perf.now() : Date.now());
      return { name: name, duration: e - s, startTime: s };
    };
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
        await tfReady;
        applyShims();
        // Wrap tf in a Proxy so user-side tf.loadLayersModel(url) resolves
        // to the stub (real export is non-writable + non-configurable).
        var stubs = globalThis.__tcStubs || {};
        // CALL SPY (2026-09-13). tf reaches the submission as a read-only
        // namespace, so a grader cannot wrap tf.variableGrads or tf.io to see
        // whether the learner CALLED it; a submission that reproduces the
        // right numbers by other means (finite differences, a hand-assembled
        // artifact, a table) passed graders that exist to teach the call.
        // Counters live on tf.__calls: top-level entry points by name
        // ('variableGrads', 'sequential', ...), nested namespaces by
        // 'layers.dense', 'io.withSaveHandler', 'train.adam', and
        // LayersModel.prototype.save as 'model.save'. Fresh per run. The CI
        // validator (scripts/validate-exercises.mjs) implements the identical
        // spy, and the corpus parity test keeps them in step.
        var calls = Object.create(null);
        globalThis.__tcCalls = calls;
        if (fitRecorder) fitRecorder.reset();
        var SPIED = { variableGrads: 1, grad: 1, grads: 1, valueAndGrad: 1, valueAndGrads: 1, customGrad: 1, sequential: 1, model: 1, tidy: 1, dispose: 1, keep: 1, matMul: 1, dot: 1, transpose: 1, add: 1, sub: 1, mul: 1, div: 1, sum: 1, mean: 1, moments: 1 };
        var NESTED = { layers: 1, io: 1, train: 1, losses: 1 };
        function bump(name) { calls[name] = (calls[name] || 0) + 1; }
        function spyNamespace(ns, prefix) {
          if (typeof Proxy !== 'function' || !ns) return ns;
          return new Proxy(ns, {
            get: function(target, prop) {
              var v = target[prop];
              if (typeof v === 'function' && typeof prop === 'string') {
                return function() { bump(prefix + '.' + prop); return v.apply(this === undefined ? target : this, arguments); };
              }
              return v;
            },
          });
        }
        var tfProxy = (typeof Proxy === 'function')
          ? new Proxy(globalThis.tf, {
              get: function(target, prop) {
                // A frozen snapshot, not the live object: a forged
                // tf.__calls['model.save'] = 1 cleared a grader before this
                // (round 7b, 2026-09-14). Same rule as the validator.
                if (prop === '__calls') return Object.freeze(Object.assign(Object.create(null), calls));
                if (prop === '__fits') return fitRecorder ? fitRecorder.read() : Object.freeze([]);
                if (stubs[prop]) return stubs[prop];
                var v = target[prop];
                if (SPIED[prop] && typeof v === 'function') {
                  return function() { bump(prop); return v.apply(target, arguments); };
                }
                // tf.train is a function with members hung off it, not a plain
                // object, so both shapes are wrapped.
                if (NESTED[prop] && v && (typeof v === 'object' || typeof v === 'function')) return spyNamespace(v, prop);
                return v;
              },
              // Read-only to the submission, same rule as the validator: a
              // reassigned tf.randomUniform would pin the grader's draws.
              set: function() { return false; },
              defineProperty: function() { return false; },
              deleteProperty: function() { return false; },
            })
          : globalThis.tf;
        var fn = new Function('console', 'tf', code);
        var results = await fn(capturedConsole, tfProxy);
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
  | { ok: false; error: string; logs: ConsoleEntry[] }
  // Boot signal, sent once after the TFJS runtime finishes loading. Carries
  // no results: it exists so the host can start the execution timeout at the
  // point execution actually becomes possible, rather than charging a ~1.4 MB
  // download to the learner's 10-second budget.
  | { ready: true };

/**
 * Budget for loading the runtime, separate from the per-run execution budget.
 * Generous because it covers a 1.4 MB download on a poor connection, but
 * finite so a blocked script surfaces a real message instead of hanging.
 */
const RUNTIME_LOAD_TIMEOUT_MS = 60_000;

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
  // Name a syntax error in the learner's code as such, before it can take
  // the harness down with it. See shared-user-syntax-check above.
  const syntaxError = userCodeSyntaxError(stripTypeScript(userCode));
  if (syntaxError) {
    return {
      results: [userSyntaxErrorResult(syntaxError)],
      logs: [],
      errored: true,
    };
  }

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
      if (timer !== undefined) clearTimeout(timer);
      clearTimeout(loadTimer);
      Promise.resolve(handle.terminate()).catch(() => {});
      resolve(outcome);
    };

    // The timeout budget is for the learner's CODE, not for fetching the
    // runtime. The worker `importScripts` a 1,469,843-byte TFJS bundle before
    // it can execute anything; on a slow connection that download alone
    // exceeds 10s, so the first "Run Tests" of every such learner failed with
    // "Timed out after 10 seconds" - attributing a network problem to their
    // code, at the exact moment they are deciding whether this product works.
    //
    // The worker now posts `{ ready: true }` once the runtime is loaded, and
    // the clock starts there. `startTimer` is idempotent; the fallback below
    // covers a worker that never signals ready at all (blocked script,
    // unreachable CDN) so a hang is still bounded.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = () => {
      if (timer !== undefined || settled) return;
      timer = setTimeout(() => {
        finish({
          results: [
            {
              name: "Code execution",
              passed: false,
              error: `Timed out after ${Math.round(timeoutMs / 1000)} seconds`,
            },
          ],
          logs: [],
          errored: true,
        });
      }, timeoutMs);
    };

    // Bound the load phase separately, with a message that names the real
    // cause instead of blaming the learner's code.
    const loadTimer = setTimeout(() => {
      if (timer !== undefined || settled) return;
      finish({
        results: [
          {
            name: "Runtime load",
            passed: false,
            error:
              "The TensorFlow.js runtime did not finish loading. This is usually a slow or blocked network, not a problem with your code. Check your connection and run the tests again.",
          },
        ],
        logs: [],
        errored: true,
      });
    }, RUNTIME_LOAD_TIMEOUT_MS);

    handle.onReply((reply) => {
      // Runtime is up: stop the load budget and start the execution budget.
      // `in` rather than a cast so TypeScript narrows the union properly.
      if ("ready" in reply) {
        clearTimeout(loadTimer);
        startTimer();
        return;
      }
      // A result arriving without a prior ready signal (older worker, or a
      // synchronous failure) still needs the load budget cleared.
      clearTimeout(loadTimer);
      startTimer();
      if (reply.ok) {
        finish({ results: reply.results, logs: reply.logs });
      } else {
        finish({
          results: [
            { name: "Code execution", passed: false, error: reply.error },
          ],
          logs: reply.logs,
          errored: true,
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
