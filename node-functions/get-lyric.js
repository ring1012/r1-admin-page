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
  } else {
    return new Response(JSON.stringify({ code: 200, msg: "success", data: { lrclist: [] } }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const response = await fetch(fetchUrl, {
      headers: fetchHeaders,
    });

    const data = await response.json();
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
