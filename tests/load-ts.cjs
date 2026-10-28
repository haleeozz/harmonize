const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

module.exports = function createLoader() {
  const loaded = new Map();
  function load(file) {
    const full = path.resolve(__dirname, '..', file);
    if (loaded.has(full)) return loaded.get(full).exports;
    const output = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const mod = { exports: {} }; loaded.set(full, mod);
    const requireLocal = name => name.startsWith('.') ? load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(full), name + '.ts'))) : require(name);
    new Function('require', 'module', 'exports', output)(requireLocal, mod, mod.exports);
    return mod.exports;
  }
  return load;
};
