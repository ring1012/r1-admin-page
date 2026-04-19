export default async function onRequest(context) {
  const { request } = context;


  // EdgeOne might expose KV via context.env.r1_kv or globally as r1_kv
  const kv = r1_kv;

  const serial = request.headers.get('x-r1-serial');
  if (!serial) {
    return new Response(JSON.stringify({ error: 'x-r1-serial header is missing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const method = request.method;

  try {
    const indexKey = `${serial}:playlists:index`;

    // Helper: Get Playlist Index
    const getIndex = async () => {
      let index = await kv.get(indexKey);
      if (!index) {
        // Initialize default playlist
        const defaultIndex = [{
          uuid: 'default',
          name: '我的收藏',
          desc: '默认收藏歌单'
        }];
        await kv.put(indexKey, JSON.stringify(defaultIndex));
        return defaultIndex;
      }
      return JSON.parse(index);
    };

    // Helper: Save Playlist Index
    const saveIndex = async (indexArr) => {
      await kv.put(indexKey, JSON.stringify(indexArr));
    };

    // --- GET /api/playlist?action=list ---
    if (method === 'GET' && action === 'list') {
      const index = await getIndex();
      return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
    }

    // --- GET /api/playlist?action=get_songs&uuid=xyz ---
    if (method === 'GET' && action === 'get_songs') {
      const uuid = url.searchParams.get('uuid') || 'default';
      const songs = await kv.get(`${serial}:playlist:${uuid}`);
      return new Response(songs || '[]', { headers: { 'Content-Type': 'application/json' } });
    }

    // --- POST operations ---
    if (method === 'POST') {
      const body = await request.json();

      if (action === 'create' || action === 'update') {
        const index = await getIndex();
        if (action === 'create') {
          // Check limit: max 5 custom playlists (excluding default)
          const customPlaylists = index.filter(p => p.uuid !== 'default');
          if (customPlaylists.length >= 5) {
            return new Response(JSON.stringify({ error: '每个设备最多只能创建5个自定义歌单' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const newUuid = crypto.randomUUID();
          index.push({
            uuid: newUuid,
            name: body.name,
            desc: body.desc || ''
          });
          await saveIndex(index);
          // Initialize empty songs array for new playlist
          await kv.put(`${serial}:playlist:${newUuid}`, '[]');
          return new Response(JSON.stringify({ success: true, uuid: newUuid }), { headers: { 'Content-Type': 'application/json' } });
        } else {
          // update
          if (body.uuid === 'default' && body.name !== '我的收藏') {
            // allow optional description update for default, but block name change
            body.name = '我的收藏';
          }
          const p = index.find(p => p.uuid === body.uuid);
          if (p) {
            p.name = body.name;
            p.desc = body.desc || p.desc;
            await saveIndex(index);
          }
          return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
      }

      if (action === 'add_song') {
        const { uuid, name, song } = body;
        let targetUuid = uuid;
        const index = await getIndex();

        // 1. 不带歌单id，不带歌单名 -> default
        if (!targetUuid && !name) {
          targetUuid = 'default';
        }
        // 2. No UUID, but have Name -> find or create
        else if (!targetUuid && name) {
          const existing = index.find(p => p.name === name);
          if (existing) {
            targetUuid = existing.uuid;
          } else {
            // Check limit
            const customPlaylists = index.filter(p => p.uuid !== 'default');
            if (customPlaylists.length >= 5) {
              return new Response(JSON.stringify({ error: '每个设备最多只能创建5个自定义歌单' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            targetUuid = crypto.randomUUID();
            index.push({
              uuid: targetUuid,
              name: name,
              desc: ''
            });
            await saveIndex(index);
          }
        }

        // Add song to target playlist
        const pKey = `${serial}:playlist:${targetUuid}`;
        let songsData = await kv.get(pKey);
        let songs = songsData ? JSON.parse(songsData) : [];

        // Prevent duplicates
        if (!songs.some(s => s.itemId === song.itemId)) {
          songs.push(song);
          await kv.put(pKey, JSON.stringify(songs));
        }

        return new Response(JSON.stringify({ success: true, uuid: targetUuid }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // --- DELETE operations ---
    if (method === 'DELETE') {
      if (action === 'delete') {
        const uuid = url.searchParams.get('uuid');
        if (uuid === 'default') {
          return new Response(JSON.stringify({ error: 'Cannot delete default playlist' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        let index = await getIndex();
        index = index.filter(p => p.uuid !== uuid);
        await saveIndex(index);
        await kv.delete(`${serial}:playlist:${uuid}`);
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (action === 'remove_song') {
        const uuid = url.searchParams.get('uuid');
        const songId = url.searchParams.get('songId');

        const pKey = `${serial}:playlist:${uuid}`;
        let songsData = await kv.get(pKey);
        if (songsData) {
          let songs = JSON.parse(songsData);
          songs = songs.filter(s => s.itemId !== songId);
          await kv.put(pKey, JSON.stringify(songs));
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action or method' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Playlist API Error:', error.stack || error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
