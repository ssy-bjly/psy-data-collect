const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: '环境变量未设置',
          debug: {
            SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
            SUPABASE_KEY: process.env.SUPABASE_KEY ? 'SET' : 'NOT_SET'
          }
        })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      { auth: { persistSession: false } }
    );

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
      body: JSON.stringify({ error: error.message })
    };
  }
};
