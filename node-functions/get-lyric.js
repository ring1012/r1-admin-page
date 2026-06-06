function parseLrc(lrc) {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const list = [];
  const timeRe = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeRe);
    if (!match) continue;
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    let ms = parseInt(match[3], 10);
    if (match[3].length === 2) ms *= 10;
    const time = min * 60 + sec + ms / 1000;
    const text = line.slice(match[0].length).trim();
    if (text) list.push({ lineLyric: text, time: String(time) });
  }
  return list;
}

export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type');

  if (!id || !type) {
    return new Response(JSON.stringify({ code: 400, msg: "id and type are required" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let fetchUrl = '';
  let fetchHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  if (type === 'kuwo') {
    fetchUrl = `https://www.kuwo.cn/openapi/v1/www/lyric/getlyric?musicId=${id}&httpsStatus=1&reqId=105&plat=web_www&from=lrc`;
    fetchHeaders["Referer"] = "https://www.kuwo.cn/play_detail/";
  } else if (type === 'youtube') {
    fetchUrl = `https://yt.huan.dedyn.io/youtube/music/getlyric?videoId=${id}`;
  } else if (type.startsWith('lx-')) {
    const source = type.replace('lx-', '');
    fetchUrl = `https://lx.air1.bot.cd/api/music/lyric?songmid=${id}&source=${source}`;
  } else {
    return new Response(JSON.stringify({ code: 200, msg: "success", data: { lrclist: [] } }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const response = await fetch(fetchUrl, { headers: fetchHeaders });
    const data = await response.json();

    // If the response has a "lyric" field with LRC text, parse it into lrclist
    if (data.lyric) {
      const lrclist = parseLrc(data.lyric);
      return new Response(JSON.stringify({ code: 200, msg: "success", data: { lrclist }, success: true }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ code: 500, msg: error.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
