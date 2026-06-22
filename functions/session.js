const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';

function getClientIp(event) {
  const forwarded = event.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : event.headers['client-ip'] || '';
  return ip.replace(/^::ffff:/, '');
}

function ipHash(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
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

exports.handler = async (event) => {
  const isDebug = event.path.includes('/debug/');

  if (isDebug) {
    const debugNumber = Number(String(Date.now()).slice(-6));
    const groupNumber = groupForNumber(debugNumber);
    return {
      statusCode: 201,
      body: JSON.stringify({
        submitted: false,
        debug: true,
        groupNumber,
        participantCode: `D${String(debugNumber).padStart(6, '0')}`,
        condition: conditionForGroup(groupNumber)
      })
    };
  }

  try {
    const ip = getClientIp(event);
    const hash = ipHash(ip);

    // 查询最大编号
    const { data: responses, error: respError } = await supabase
      .from('responses')
      .select('participant_code, server_code');
    
    const { data: sessions, error: sessError } = await supabase
      .from('sessions')
      .select('participant_code');

    if (respError || sessError) throw respError || sessError;

    const maxCodeNumber = (rows = []) => {
      return rows.reduce((max, row) => {
        const value = Number.parseInt(row.participant_code || row.server_code || '0', 10);
        return Number.isFinite(value) ? Math.max(max, value) : max;
      }, 0);
    };

    const nextNumber = Math.max(maxCodeNumber(responses), maxCodeNumber(sessions)) + 1;
    const groupNumber = groupForNumber(nextNumber);
    const sessionId = crypto.randomUUID();
    const participantCode = String(nextNumber).padStart(3, '0');

    // 创建session
    const { error: insertError } = await supabase
      .from('sessions')
      .insert([{
        id: sessionId,
        participant_code: participantCode,
        group_number: groupNumber,
        condition: conditionForGroup(groupNumber),
        ip_hash: hash,
        created_at: new Date().toISOString()
      }]);

    if (insertError) throw insertError;

    return {
      statusCode: 201,
      body: JSON.stringify({
        submitted: false,
        sessionId,
        groupNumber,
        participantCode,
        condition: conditionForGroup(groupNumber)
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '创建session失败' })
    };
  }
};
