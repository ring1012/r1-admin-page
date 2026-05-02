export default async function onRequest(context) {
  const { request } = context;
  const kv = r1_kv;

  const serial = request.headers.get('x-r1-serial');
  if (!serial) {
    return new Response(JSON.stringify({ error: 'x-r1-serial header is missing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword');
  if (!keyword) {
    return new Response(JSON.stringify({ error: 'keyword is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const indexKey = `${serial}:playlists:index`;
    const indexStr = await kv.get(indexKey);
    const index = indexStr ? JSON.parse(indexStr) : [{ uuid: 'default', name: '我的收藏' }];

    // Simple similarity function (Levenshtein)
    function getSimilarity(s1, s2) {
      if (!s1 || !s2) return 0;
      s1 = s1.toLowerCase();
      s2 = s2.toLowerCase();
      if (s1 === s2) return 1.0;

      const editDistance = (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
          }
        }
        return matrix[b.length][a.length];
      };

      const dist = editDistance(s1, s2);
      const maxLen = Math.max(s1.length, s2.length);
      return (maxLen - dist) / maxLen;
    }

    // Find best match
    let bestMatch = null;
    let maxScore = -1;

    for (const p of index) {
      const score = getSimilarity(keyword, p.name);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = p;
      }
    }

    // Threshold for matching
    if (!bestMatch || maxScore < 0.3) {
      return new Response(JSON.stringify({ count: 0, musicinfo: [], errorCode: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch songs for the best match
    const songsData = await kv.get(`${serial}:playlist:${bestMatch.uuid}`);
    const songs = songsData ? JSON.parse(songsData) : [];

    const musicinfo = songs.map((s) => ({
      id: s.itemId,
      title: s.title,
      album: s.album,
      artist: s.artist,
      imgUrl: s.imgUrl,
      url: s.url
    }));

    const result = {
      count: musicinfo.length,
      musicinfo: musicinfo,
      pagesize: String(musicinfo.length),
      errorCode: 0,
      page: "1",
      source: 1
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('PlayList Match API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
