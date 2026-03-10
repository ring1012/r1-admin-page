export default async function onRequest(context) {

  const testData = await r1.get("test");

  return new Response(JSON.stringify({
    message: testData,
    geo: geo,
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}