export default async function onRequestGet({ request, params, env }) {
  try {
    const commandsData = await r1_kv.get("commands");

    return new Response(commandsData, {
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
