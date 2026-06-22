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

function generateParticipantCode() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
}

function groupSeedFromCode(code) {
  const seed = Number.parseInt(code.slice(-4), 16);
  return Number.isFinite(seed) ? seed : Date.now();
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

    const participantCode = generateParticipantCode();
    const groupNumber = groupForNumber(groupSeedFromCode(participantCode));
    const sessionId = crypto.randomUUID();

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
