export default async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Only POST supported' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const config = await request.json();
    const { endpoint, key, model, extraBody } = config;

    if (!endpoint || !key || !model) {
      return new Response(JSON.stringify({ success: false, message: '配置不完整：缺少 endpoint, key 或 model' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse extraBody if it exists
    let extraParams = {};
    if (extraBody) {
      try {
        extraParams = JSON.parse(extraBody);
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: '附加请求体 (extraBody) 不是有效的 JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const payload = {
      model,
      messages: [
        { role: 'user', content: '请告诉我北京今天的天气' }
      ],
      ...extraParams,
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_current_temperature',
            description: 'Get the current temperature for a specific location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g., San Francisco, CA'
                },
                unit: {
                  type: 'string',
                  enum: ['Celsius', 'Fahrenheit'],
                  description: "The temperature unit to use. Infer this from the user's location."
                }
              },
              required: ['location', 'unit']
            }
          }
        }
      ],
      function_call: 'auto'
    };

    console.log(payload);
    console.log(key);

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({
        success: false,
        message: `HTTP 错误 ${response.status}: ${errorText || '未知错误'}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Check for tool call
    const toolCalls = data.choices?.[0]?.message?.tool_calls;
    const hasCorrectToolCall = toolCalls?.some(
      (tc) => tc.function?.name === 'get_current_temperature'
    );

    if (hasCorrectToolCall) {
      return new Response(JSON.stringify({ success: true, message: '测试成功：模型已正确触发函数调用' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '测试失败：模型未返回预期的函数调用 (get_current_temperature)',
        debug: data
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: `内部错误: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
