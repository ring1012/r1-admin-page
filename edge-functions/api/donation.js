export default async function onRequest(context) {
  const { request } = context;
  const method = request.method;
  
  // EdgeOne exposes KV globally as r1_kv
  const kv = r1_kv;

  if (method === 'GET') {
    try {
      let donationData = [];
      if (kv) {
        donationData = await kv.get("r1-donation");
      }

      return new Response(donationData, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
