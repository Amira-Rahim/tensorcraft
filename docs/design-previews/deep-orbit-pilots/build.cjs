const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
function dependency(name) {
  try { return require(require.resolve(name, { paths: [root] })); } catch {
    const store = path.join(root, 'node_modules/.pnpm');
    const match = fs.readdirSync(store).find(p => p.startsWith(name + '@'));
    if (!match) throw new Error(`Install workspace dependencies: ${name} is missing.`);
    return require(path.join(store, match, 'node_modules', name));
  }
}
const yaml = dependency('yaml');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const foundation = fs.readFileSync(path.join(__dirname, '../foundations/index.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'shared.css'), '/* Generated from the approved Foundations prototype. Run build.cjs to refresh. */\n' + foundation.match(/<style>([\s\S]*?)<\/style>/)[1].replaceAll('url("assets/', 'url("../foundations/assets/'));
const exercises = ['training-loop-exercise', 'deep-scan-eval'].map(slug => {
  const source = fs.readFileSync(path.join(root, `packages/content/content/deep-orbit/training-loop/exercises/${slug}.yaml`), 'utf8');
  const exercise = yaml.parse(source);
  const marker = slug === 'training-loop-exercise' ? 'function makeEarlyStopping()' : 'const history = null;';
  const split = exercise.starterCode.indexOf(marker);
  if (split < 0) throw new Error(`Starter boundary changed for ${slug}`);
  const readout = slug === 'training-loop-exercise'
    ? `\n// Preview readout: report values from your completed code.\nif (typeof history !== 'undefined' && history?.history?.loss) {\n  console.log('Epochs recorded:', history.history.loss.length);\n  console.log('Final training loss:', history.history.loss.at(-1));\n  console.log('Final validation loss:', history.history.val_loss?.at(-1));\n}\n`
    : `\n// Preview readout: report the values your code assigned.\nif (typeof trainAcc !== 'undefined') console.log('Training accuracy:', trainAcc);\nif (typeof testAcc !== 'undefined') console.log('Test accuracy:', testAcc);\nif (typeof verdict !== 'undefined') console.log('Gap rule:', verdict);\n`;
  return { slug, sourceHash: hash(source), title: exercise.title, instructions: exercise.instructions,
    setup: exercise.starterCode.slice(0, split), starter: exercise.starterCode.slice(split), testCode: exercise.testCode, readout };
});
fs.writeFileSync(path.join(__dirname, 'exercises.json'), JSON.stringify(exercises, null, 2) + '\n');
dependency('esbuild').buildSync({
  entryPoints: [path.join(root, 'packages/ui/src/mdx/exercise-runner.ts')],
  outfile: path.join(__dirname, 'runner.js'), bundle: true, format: 'esm', target: 'es2022',
  banner: { js: '// Generated from the existing production exercise runner. Run build.cjs to refresh.' },
});
console.log('Built shared styles, two canonical exercises, and existing worker runner.');
