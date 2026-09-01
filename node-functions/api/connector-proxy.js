import http from 'node:http';

function javaHashCode(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = 31 * hash + input.charCodeAt(i);
    hash = hash | 0;
  }
  return hash;
}

function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'entry.typo.de5.net',
      port: 80,
      path: url,
      method: options.method,
      headers: options.headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, text: () => data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export default async function onRequest(context) {
  const request = context.request;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const body = await request.json();
    const { deviceId, path, method = 'POST', payload } = body;

    if (!deviceId || !path) {
      return new Response(JSON.stringify({ error: 'Missing deviceId or path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const trimmed = deviceId.trim();
    const hash = Math.abs(javaHashCode(trimmed));
    const n = hash % 6;
    const targetHost = `xn--3ug.t${n}.typo.de5.net`;

    const headers = { 'Content-Type': 'application/json', 'Host': targetHost };
    const bodyStr = (method !== 'GET' && payload !== undefined) ? JSON.stringify(payload) : undefined;

    const response = await httpRequest(path, { method, headers }, bodyStr);
    const data = response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
