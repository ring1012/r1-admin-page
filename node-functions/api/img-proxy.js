export default async function onRequest(context) {
  const request = context.request;
  const { searchParams } = new URL(request.url);
  const imgUrl = searchParams.get('url');

  if (!imgUrl) {
    return new Response('Missing "url" parameter', { status: 400 });
  }

  try {
    const response = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const body = await response.arrayBuffer();

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for a long time
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
