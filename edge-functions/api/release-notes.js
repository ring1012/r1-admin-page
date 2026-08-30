export default async function onRequestGet({ request, params, env }) {
  try {
    const data = await r1_kv.get("release-notes");

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}