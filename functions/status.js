const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

exports.handler = async (event) => {
  try {
    const { count, error } = await supabase
      .from('responses')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        submitted: false,
        count: count || 0
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '获取状态失败' })
    };
  }
};
