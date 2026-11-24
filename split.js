// split.js — تقسیم فایل‌های JSON به تکه‌های ماهانه + ساخت manifest
// node split.js           (تقسیم + بررسی + جایگزینی پوشه parts)
// node split.js --check   (فقط بررسی؛ به پروژه دست نمی‌زند)
// node split.js --force   (اجازه کاهش شدید تعداد ردیف‌ها)
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const CHECK_ONLY = process.argv.includes('--check');
const FORCE = process.argv.includes('--force');
const SRC = __dirname;
const REPO_PARTS = path.join(SRC, 'parts');
const TMP = path.join(os.tmpdir(), 'lme-split-' + Date.now());
const TMP_PARTS = path.join(TMP, 'parts');

const DATASETS = [
  { name: 'LME_database',            file: 'LME_database.json',            dateField: 'تاریخ میلادی' },
  { name: 'WagonsWithWeight',        file: 'WagonsWithWeight.json',        dateField: 'تاریخ' },
  { name: 'master_tabel_for_tracks', file: 'master_tabel_for_tracks.json', dateField: 'تاریخ' },
  { name: 'BalanceCounter',          file: 'BalanceCounter.json',          dateField: 'تاریخ بیلانس' },
  { name: 'FinancialStatement',      file: 'FinancialStatement.json',      dateField: 'تاریخ بارگیری' },
];

const fail = (msg) => { console.error('\n❌ ' + msg); process.exit(1); };
const hash = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);

function monthKey(v) {
  const s = String(v ?? '').trim();
  let y, m, d, r;
  if ((r = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) { m = +r[1]; d = +r[2]; y = +r[3]; }
  else if ((r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) { y = +r[1]; m = +r[2]; d = +r[3]; }
  else return 'undated';
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return 'undated';
  return `${y}-${String(m).padStart(2, '0')}`;
}

function readJson(file) {
  const p = path.join(SRC, file);
  if (!fs.existsSync(p)) fail(`فایل پیدا نشد: ${file}`);
  let text = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) fail(`${file}: ساختار فایل آرایه نیست`);
    return data;
  } catch (e) { fail(`${file}: JSON خراب است (${e.message})`); }
}

let prev = {};
try { prev = JSON.parse(fs.readFileSync(path.join(REPO_PARTS, 'manifest.json'), 'utf8')).files || {}; } catch {}

fs.mkdirSync(TMP_PARTS, { recursive: true });
const manifest = { files: {} };
let allOk = true;

console.log(CHECK_ONLY ? '— حالت بررسی (به پروژه دست نمی‌زنیم) —\n' : '');

for (const ds of DATASETS) {
  const rows = readJson(ds.file);
  if (rows.length === 0) fail(`${ds.file}: فایل خالی است. ارسال متوقف شد.`);

  const prevTotal = Object.values(prev[ds.name] || {}).reduce((s, x) => s + (x.n || 0), 0);
  if (!FORCE && prevTotal > 50 && rows.length < prevTotal * 0.8) {
    fail(`${ds.file}: تعداد ردیف‌ها از ${prevTotal} به ${rows.length} کم شده. اگر درست است با  node split.js --force  اجرا کن.`);
  }

  const groups = new Map();
  for (const row of rows) {
    const k = monthKey(row && row[ds.dateField]);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(row);
  }

  const dir = path.join(TMP_PARTS, ds.name);
  fs.mkdirSync(dir, { recursive: true });
  const entries = {};
  for (const k of [...groups.keys()].sort()) {
    const text = JSON.stringify(groups.get(k));
    fs.writeFileSync(path.join(dir, k + '.json'), text, 'utf8');
    entries[k] = { h: hash(text), n: groups.get(k).length };
  }
  manifest.files[ds.name] = entries;

  // بررسی: خواندن دوباره از دیسک و مقایسه با فایل اصلی
  const count = new Map();
  for (const row of rows) { const s = JSON.stringify(row); count.set(s, (count.get(s) || 0) + 1); }
  let total = 0, ok = true;
  for (const [k, e] of Object.entries(entries)) {
    const text = fs.readFileSync(path.join(dir, k + '.json'), 'utf8');
    if (hash(text) !== e.h) ok = false;
    const part = JSON.parse(text);
    if (part.length !== e.n) ok = false;
    total += part.length;
    for (const row of part) {
      const s = JSON.stringify(row);
      const c = count.get(s);
      if (!c) { ok = false; break; }
      count.set(s, c - 1);
    }
  }
  if (total !== rows.length) ok = false;
  for (const c of count.values()) if (c !== 0) ok = false;

  const und = entries.undated ? entries.undated.n : 0;
  console.log(`${ok ? '✅' : '❌'} ${ds.name}: ${rows.length} ردیف → ${Object.keys(entries).length} تکه` + (und ? `  ⚠ ${und} ردیف بدون تاریخ معتبر` : ''));
  if (und) groups.get('undated').slice(0, 3).forEach(r => console.log('     نمونه:', JSON.stringify(r).slice(0, 140)));
  if (!ok) allOk = false;
}

if (!allOk) fail('بررسی تطابق شکست خورد. هیچ چیز تغییر نکرد.');

fs.writeFileSync(path.join(TMP_PARTS, 'manifest.json'), JSON.stringify(manifest), 'utf8');

if (CHECK_ONLY) {
  console.log('\n✅ همه چیز درست است. (چیزی در پروژه تغییر نکرد)');
} else {
  fs.rmSync(REPO_PARTS, { recursive: true, force: true });
  fs.cpSync(TMP_PARTS, REPO_PARTS, { recursive: true });
  console.log('\n✅ پوشه parts با موفقیت ساخته شد.');
}
fs.rmSync(TMP, { recursive: true, force: true });