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

    const preview = (data || []).map(row => ({
      participantCode: row.participant_code,
      serverCode: row.server_code,
      submittedAt: row.submitted_at,
      groupNumber: row.group_number,
      condition: typeof row.condition === 'string' ? JSON.parse(row.condition) : row.condition,
      durationMs: row.duration_ms,
      futureTrait: (row.data?.futureTrait) || {},
      controlPre: (row.data?.controlPre) || {},
      controlPost: (row.data?.controlPost) || {},
      productChoices: (row.data?.productChoices) || {},
      donationAmount: (row.data?.donationAmount) || null
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preview)
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '获取预览失败' })
    };
  }
};
