/**
 * 八字 AI 对话 API（调 SiliconFlow）
 * POST /api/bazi/chat
 *
 * Body:
 *   messages: { role: 'user' | 'assistant'; content: string }[]
 *   baziResult: object  (calc API 返回的 bazi + dayun JSON)
 *   model?: string      (可选，默认 deepseek-ai/DeepSeek-V3.2)
 *
 * Response: { reply: string }
 */
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.SILICONFLOW_API_URL!;
const API_KEY = process.env.SILICONFLOW_API_KEY!;
const DEFAULT_MODEL = process.env.SILICONFLOW_MODEL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, baziResult, model = DEFAULT_MODEL } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages 必须是数组' },
        { status: 400 }
      );
    }

    if (!baziResult) {
      return NextResponse.json(
        { error: '缺少 baziResult（八字计算结果）' },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: '未配置 SILICONFLOW_API_KEY' },
        { status: 500 }
      );
    }

    // 构造系统提示词：把八字结果作为上下文
    const systemPrompt = `你是一位专业的命理分析师，擅长基于八字命盘进行解读。
以下是用户的八字排盘结果（JSON 格式），请基于此回答用户的问题。
请不要重复输出完整的排盘结果，只针对用户的问题进行解读和分析。

八字结果：
${JSON.stringify(baziResult, null, 2)}`;

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: false,
    };

    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[SiliconFlow Error]', upstream.status, errText);
      return NextResponse.json(
        { error: `SiliconFlow API 错误: ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[API /api/bazi/chat] Error:', err);
    return NextResponse.json(
      { error: err.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}
