#!/usr/bin/env node
/**
 * 测试运行器：把 tests/*.test.js 注入到「我的工作台.html」的副本里，
 * 用 Edge 无头模式真实加载并执行，解析页面回写的 JSON 结果。
 *
 * 用法：
 *   node tests/runner.js            # 跑全部
 *   node tests/runner.js m0 m3      # 只跑指定阶段
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, '我的工作台.html');
const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const HARNESS = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');

const STAGES = [
  ['m0', 'M0 骨架与数据层'],
  ['m1', 'M1 首页 + 今日计划'],
  ['m2', 'M2 自媒体'],
  ['m3', 'M3 开发 + 咨询'],
  ['m4', 'M4 健身 + 饮食 + 游戏'],
  ['m5', 'M5 设置 + 备份 + 边界']
];

function runOne(key, label){
  const file = path.join(__dirname, key + '.test.js');
  if(!fs.existsSync(file)) return { key, label, error: '缺少测试文件 ' + file };

  const app = fs.readFileSync(APP, 'utf8');
  const test = fs.readFileSync(file, 'utf8');
  const html = app.replace('</body>',
    '<script>\n' + HARNESS + '\n</script>\n<script>\n' + test + '\n</script>\n</body>');

  const tmpFile = path.join(os.tmpdir(), 'wb-test-' + key + '-' + Date.now() + '.html');
  fs.writeFileSync(tmpFile, html);
  const profile = path.join(os.tmpdir(), 'wb-test-profile');

  const res = spawnSync(EDGE, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--user-data-dir=' + profile,
    '--window-size=1280,900',
    '--virtual-time-budget=15000',
    '--dump-dom',
    'file:///' + tmpFile.replace(/\\/g, '/')
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 120000 });

  const out = res.stdout || '';
  const m = out.match(/<script type="application\/json" id="TESTRESULT">([\s\S]*?)<\/script>/);
  if(!m){
    return { key, label, error: '页面未回写结果（可能脚本报错）', raw: out.length };
  }
  let results;
  try { results = JSON.parse(m[1]); }
  catch(e){ return { key, label, error: '结果解析失败：' + e.message }; }
  return { key, label, results };
}

const args = process.argv.slice(2);
const targets = args.length ? STAGES.filter(s => args.includes(s[0])) : STAGES;

let totalPass = 0, totalFail = 0, failedSuites = 0;

for(const [key, label] of targets){
  const r = runOne(key, label);
  console.log('\n=== ' + label + ' (' + key + ') ===');
  if(r.error){
    console.log('  ✗ ' + r.error);
    failedSuites++;
    continue;
  }
  let pass = 0, fail = 0;
  for(const c of r.results){
    if(c.ok){ pass++; console.log('  ✓ ' + c.n); }
    else { fail++; console.log('  ✗ ' + c.n + '  →  ' + c.msg); }
  }
  totalPass += pass; totalFail += fail;
  if(fail || pass === 0) failedSuites++;
  console.log('  小计：' + pass + ' 通过 / ' + fail + ' 失败');
}

console.log('\n──────────────────────────────');
console.log('总计：' + totalPass + ' 通过 / ' + totalFail + ' 失败，失败套件 ' + failedSuites + ' 个');
console.log('──────────────────────────────');
process.exit(totalFail > 0 || failedSuites > 0 ? 1 : 0);
