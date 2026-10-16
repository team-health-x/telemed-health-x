const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { customerFirstName } = require('../app/lib/customer-display-name.ts');
test('uses the given name, not a separate title, for registration and login sessions', () => {
  for (const title of ['นางสาว', 'นาง', 'นาย', 'น.ส.', 'Mr.', 'Mrs.', 'Ms.', 'Dr.']) {
    assert.equal(customerFirstName(`${title} พิมพ์ชนก วัฒนากุล`), 'พิมพ์ชนก');
  }
  assert.equal(customerFirstName('  พิมพ์ชนก   วัฒนากุล '), 'พิมพ์ชนก');
  assert.equal(customerFirstName('นางฟ้า วัฒนากุล'), 'นางฟ้า');
  assert.equal(customerFirstName(''), 'สมาชิก');
});
