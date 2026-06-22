const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';

function getAdminToken(event) {
  const token = event.headers['x-admin-token'];
  const url = new URL(`http://${event.headers.host || 'localhost'}${event.rawUrl || event.path}`);
  return token || url.searchParams.get('token') || '';
}

function requireAdmin(event) {
  return getAdminToken(event) === ADMIN_TOKEN;
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
    delete exportRow.ip_hash;
    delete exportRow.timings;
    delete exportRow.duration_seconds;
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

exports.handler = async (event) => {
  if (!requireAdmin(event)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: '后台访问令牌不正确。' })
    };
  }

  try {
    const { data, error } = await supabase
      .from('responses')
      .select('*');

    if (error) throw error;

    const csv = buildCsv(data || []);
    const date = new Date().toISOString().slice(0, 10);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="psychology-experiment-${date}.csv"`,
        'Cache-Control': 'no-store'
      },
      body: csv,
      isBase64Encoded: false
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '导出失败' })
    };
  }
};
