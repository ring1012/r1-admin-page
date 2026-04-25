export default async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const musicApi = url.searchParams.get('musicApi');
  const keyword = url.searchParams.get('keyword');

  if (!musicApi || !keyword) {
    return new Response(JSON.stringify({ error: 'musicApi and keyword are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const targetUrl = `${musicApi.trim().replace(/\/$/, '')}/search?keyword=${encodeURIComponent(keyword)}`;
    const response = await fetch(targetUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Custom Search API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
