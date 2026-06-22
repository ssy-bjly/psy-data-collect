const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

function getClientIp(event) {
  const forwarded = event.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : event.headers['client-ip'] || '';
  return ip.replace(/^::ffff:/, '');
}

function ipHash(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function generateServerCode() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(2, 14);
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${stamp}${suffix}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: '方法不允许' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const isDebug = event.path.includes('/debug/');
    const ip = getClientIp(event);
    const hash = ipHash(ip);

    const serial = generateServerCode();
    const table = isDebug ? 'debug_responses' : 'responses';

    // 查询session（如果有sessionId）
    let session = null;
    if (!isDebug && payload.sessionId) {
      const { data, error: sessError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', payload.sessionId)
        .single();
      if (!sessError) session = data;
    }

    const condition = session?.condition || payload.condition || {};
    const participantCode = isDebug
      ? `D${serial}`
      : session?.participant_code || payload.participantCode || serial;

    const response = {
      id: crypto.randomUUID(),
      participant_code: participantCode,
      server_code: serial,
      submitted_at: new Date().toISOString(),
      debug: isDebug,
      group_number: session?.group_number || payload.groupNumber || null,
      ip_hash: hash,
      user_agent: event.headers['user-agent'] || '',
      condition,
      duration_ms: Number(payload.durationMs || 0),
      data: payload.data || {}
    };

    const { error: insertError } = await supabase
      .from(table)
      .insert([response]);

    if (insertError) throw insertError;

    return {
      statusCode: 201,
      body: JSON.stringify({
        ok: true,
        participantCode: response.participant_code
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '提交失败：' + error.message })
    };
  }
};
