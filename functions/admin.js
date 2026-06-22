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
    const { data, count, error } = await supabase
      .from('responses')
      .select('submitted_at', { count: 'exact' });

    if (error) throw error;

    const latestSubmittedAt = data && data.length > 0 
      ? data[data.length - 1].submitted_at 
      : null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        count: count || 0,
        latestSubmittedAt
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '获取管理员信息失败' })
    };
  }
};
