export default async function onRequestGet({ request, params, env }) {

  const testData = await r1_kv.get("test");

  return new Response(JSON.stringify({
    message: testData
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}