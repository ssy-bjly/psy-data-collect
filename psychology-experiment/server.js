const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const DEBUG_RESPONSES_FILE = path.join(DATA_DIR, 'debug-responses.json');

// Supabase 初始化
const SUPABASE_URL = 'https://mgqglvowjbjcwobhbsvd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sSIj7DACJhbNwL7_wpa2Lg_lydHKVNH';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function uploadToSupabase(response) {
  try {
    const { error } = await supabase
      .from('responses')
      .insert([{
        id: response.id,
        participant_code: response.participantCode,
        server_code: response.serverCode,
        submitted_at: response.submittedAt,
        debug: response.debug,
        group_number: response.groupNumber,
        ip_hash: response.ipHash,
        user_agent: response.userAgent,
        condition: response.condition,
        duration_ms: response.durationMs,
        data: response.data
      }]);
    if (error) {
      console.error('Supabase insert error:', error.message);
    } else {
      console.log('✓ Data uploaded to Supabase:', response.participantCode);
    }
  } catch (err) {
    console.error('Supabase upload error:', err && err.message ? err.message : err);
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RESPONSES_FILE)) fs.writeFileSync(RESPONSES_FILE, '[]\n', 'utf8');
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, '[]\n', 'utf8');
if (!fs.existsSync(DEBUG_RESPONSES_FILE)) fs.writeFileSync(DEBUG_RESPONSES_FILE, '[]\n', 'utf8');

function readJsonArray(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
  } catch {
    return [];
  }
}

function writeJsonArray(filePath, rows) {
  const tempFile = `${filePath}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(rows, null, 2), 'utf8');
  fs.renameSync(tempFile, filePath);
}

function readResponses() {
  return readJsonArray(RESPONSES_FILE);
}

function writeResponses(rows) {
  writeJsonArray(RESPONSES_FILE, rows);
}

function readSessions() {
  return readJsonArray(SESSIONS_FILE);
}

function writeSessions(rows) {
  writeJsonArray(SESSIONS_FILE, rows);
}

function readDebugResponses() {
  return readJsonArray(DEBUG_RESPONSES_FILE);
}

function writeDebugResponses(rows) {
  writeJsonArray(DEBUG_RESPONSES_FILE, rows);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = (raw || req.socket.remoteAddress || '').split(',')[0].trim();
  return ip.replace(/^::ffff:/, '');
}

function ipHash(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(payload);
}

function collectJson(req, res, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 2_000_000) {
      send(res, 413, { error: '提交数据过大。' });
      req.destroy();
    }
  });
  req.on('end', () => {
    try {
      callback(JSON.parse(body || '{}'));
    } catch {
      send(res, 400, { error: '提交格式不是有效 JSON。' });
    }
  });
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const relative = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, relative));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, 'Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}

function getAdminToken(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return req.headers['x-admin-token'] || url.searchParams.get('token') || '';
}

function flattenObject(input, prefix = '', out = {}) {
  if (input === null || input === undefined) {
    out[prefix] = '';
    return out;
  }
  if (Array.isArray(input)) {
    out[prefix] = input.join('; ');
    return out;
  }
  if (typeof input !== 'object') {
    out[prefix] = input;
    return out;
  }
  Object.entries(input).forEach(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    flattenObject(value, next, out);
  });
  return out;
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\r\n\t]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildCsv(rows) {
  const flatRows = rows.map(row => {
    const exportRow = { ...row };
    delete exportRow.ipHash;
    delete exportRow.timings;
    delete exportRow.durationSeconds;
    const flat = flattenObject(exportRow);
    return flat;
  });
  const headers = Array.from(new Set(flatRows.flatMap(row => Object.keys(row))));
  const lines = [
    headers.join(','),
    ...flatRows.map(row => headers.map(header => escapeCsv(row[header])).join(','))
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

function handleSubmit(req, res, options = {}) {
  collectJson(req, res, payload => {
    const isDebug = Boolean(options.debug);
    const ip = getClientIp(req);
    const hash = ipHash(ip);
    const rows = isDebug ? readDebugResponses() : readResponses();

    const now = new Date();
    const serial = String(rows.length + 1).padStart(3, '0');
    const session = !isDebug && payload.sessionId
      ? readSessions().find(row => row.id === payload.sessionId)
      : null;
    const condition = session?.condition || payload.condition || {};
    const participantCode = isDebug
      ? `D${serial}`
      : session?.participantCode || payload.participantCode || serial;
    const response = {
      id: crypto.randomUUID(),
      participantCode,
      serverCode: serial,
      submittedAt: now.toISOString(),
      debug: isDebug,
      groupNumber: session?.groupNumber || payload.groupNumber || null,
      ipHash: hash,
      userAgent: req.headers['user-agent'] || '',
      condition,
      durationMs: Number(payload.durationMs || 0),
      data: payload.data || {}
    };

    rows.push(response);
    if (isDebug) writeDebugResponses(rows);
    else writeResponses(rows);
    send(res, 201, { ok: true, participantCode: response.participantCode });
    // 将提交异步上传到 Supabase
    uploadToSupabase(response);
  });
}

function maxCodeNumber(rows) {
  return rows.reduce((max, row) => {
    const value = Number.parseInt(row.participantCode || row.serverCode || '0', 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
}

function conditionForGroup(groupNumber) {
  const map = {
    1: { resource: 'neutral', time: 'neutral' },
    2: { resource: 'neutral', time: 'future' },
    3: { resource: 'scarcity', time: 'neutral' },
    4: { resource: 'scarcity', time: 'future' }
  };
  return map[groupNumber] || map[1];
}

function groupForNumber(number) {
  return ((number - 1) % 4) + 1;
}

function handleSession(req, res, options = {}) {
  if (options.debug) {
    const debugNumber = Number(String(Date.now()).slice(-6));
    const groupNumber = groupForNumber(debugNumber);
    send(res, 201, {
      submitted: false,
      debug: true,
      groupNumber,
      participantCode: `D${String(debugNumber).padStart(6, '0')}`,
      condition: conditionForGroup(groupNumber)
    });
    return;
  }

  const ip = getClientIp(req);
  const hash = ipHash(ip);
  const responses = readResponses();
  const sessions = readSessions();

  const nextNumber = Math.max(maxCodeNumber(responses), maxCodeNumber(sessions)) + 1;
  const groupNumber = groupForNumber(nextNumber);
  const session = {
    id: crypto.randomUUID(),
    participantCode: String(nextNumber).padStart(3, '0'),
    groupNumber,
    condition: conditionForGroup(groupNumber),
    ipHash: hash,
    createdAt: new Date().toISOString()
  };
  sessions.push(session);
  writeSessions(sessions);
  send(res, 201, {
    submitted: false,
    sessionId: session.id,
    groupNumber: session.groupNumber,
    participantCode: session.participantCode,
    condition: session.condition
  });
}

function handleStatus(req, res) {
  const rows = readResponses();
  send(res, 200, {
    submitted: false,
    count: rows.length
  });
}

function requireAdmin(req, res) {
  if (getAdminToken(req) !== ADMIN_TOKEN) {
    send(res, 401, { error: '后台访问令牌不正确。' });
    return false;
  }
  return true;
}

function handleAdmin(req, res) {
  if (!requireAdmin(req, res)) return;
  const rows = readResponses();
  send(res, 200, {
    count: rows.length,
    latestSubmittedAt: rows.length ? rows[rows.length - 1].submittedAt : null
  });
}

function handleExport(req, res) {
  if (!requireAdmin(req, res)) return;
  const csv = buildCsv(readResponses());
  res.writeHead(200, {
    'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
    'Content-Disposition': `attachment; filename="psychology-experiment-${new Date().toISOString().slice(0, 10)}.csv"`,
    'Cache-Control': 'no-store'
  });
  res.end(csv);
}

function handlePreview(req, res) {
  if (!requireAdmin(req, res)) return;
  const rows = readResponses();
  const preview = rows.map(row => {
    const data = row.data || {};
    return {
      participantCode: row.participantCode,
      serverCode: row.serverCode,
      submittedAt: row.submittedAt,
      groupNumber: row.groupNumber,
      condition: row.condition,
      durationMs: row.durationMs,
      // 未来特质量表 (7 题)
      futureTrait: data.futureTrait || {},
      // 前测控制量表 (9 题)
      controlPre: data.controlPre || {},
      // 后测控制量表 (9 题)
      controlPost: data.controlPost || {},
      // 产品选择
      productChoices: data.productChoices || {},
      // 捐款金额
      donationAmount: data.donationAmount || null
    };
  });
  send(res, 200, preview);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/status') return handleStatus(req, res);
  if (req.method === 'GET' && url.pathname === '/api/session') return handleSession(req, res);
  if (req.method === 'GET' && url.pathname === '/api/debug/session') return handleSession(req, res, { debug: true });
  if (req.method === 'POST' && url.pathname === '/api/submit') return handleSubmit(req, res);
  if (req.method === 'POST' && url.pathname === '/api/debug/submit') return handleSubmit(req, res, { debug: true });
  if (req.method === 'GET' && url.pathname === '/api/admin') return handleAdmin(req, res);
  if (req.method === 'GET' && url.pathname === '/api/preview') return handlePreview(req, res);
  if (req.method === 'GET' && url.pathname === '/api/export') return handleExport(req, res);

  if (req.method !== 'GET') {
    send(res, 405, { error: 'Method not allowed' });
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Experiment app running at http://localhost:${PORT}`);
  console.log(`Admin export: http://localhost:${PORT}/admin.html?token=${ADMIN_TOKEN}`);
});
