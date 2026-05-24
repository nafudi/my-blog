import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/auth';
import {
  getOrCreateActiveConversation,
  createConversation,
  getConversationById,
  saveMessage,
  getRecentMessages,
  toOpenAIMessages,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ==================== 配置 ====================

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || 'sk-mpewwwwmwkpfysjwtwtjdkzligqmtmwvhnzdfzyogwjnlsll';
const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1';
const MODEL = 'deepseek-ai/DeepSeek-V3';
const MAX_HISTORY = 20;
const MAX_TOKENS = 4096;

// ==================== System Prompt ====================

const SYSTEM_PROMPT = `你是一位精通八字命理的专业命理师，拥有30年实战经验，擅长结合四柱八字、大运流年、十神神煞进行全方位命理分析。

## 你的分析风格
- **专业但不晦涩**：用通俗语言解释专业术语，让普通人也能看懂
- **有深度不空泛**：基于给出的具体数据进行分析，给出针对性建议
- **客观中正**：既不夸大吉也不渲染凶，实事求是地解读
- **结构清晰**：分点陈述，重点突出

## 分析原则
1. **以数据为准**：严格依据用户提供的八字排盘数据（四柱、大运、流年、十神等）进行分析，不得自行编造数据
2. **综合分析**：将日主强弱、十神配置、大运走势、流年引动等因素综合考量
3. **给出建议**：不仅指出问题所在，更要给出具体的趋避建议
4. **回答简洁**：控制篇幅，直击要点，避免冗长铺垫
5. **边界清晰**：如果问题涉及健康、法律、投资决策等重大事项，明确说明"仅供参考，具体请咨询专业人士"

## 输出格式
- 使用适当的 emoji 增加可读性
- 重要结论用 **粗体** 标注
- 分段清晰，层次分明`;

// ==================== 主入口 ====================

export async function POST(req: Request) {
  try {
  // ---- 1. NextAuth 认证 ----
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const userId = session.user.id;

  // ---- 2. 积分检查 ----
  const COST_PER_QUERY = 10;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits < COST_PER_QUERY) {
    return NextResponse.json(
      {
        error: 'INSUFFICIENT_CREDITS',
        currentBalance: user?.credits ?? 0,
        required: COST_PER_QUERY,
        message: '积分不足，每次AI问答消耗10积分。去打赏充值吧！',
      },
      { status: 402 }
    );
  }

  // ---- 3. 解析请求体 ----
  let body: { question?: string; baziContext?: string; conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
  }

  const question = (body.question || '').trim();
  if (!question) {
    return NextResponse.json({ error: '问题不能为空' }, { status: 400 });
  }

  // ---- 4. 获取/创建对话 + 历史消息 ----
  // 支持前端传入指定 conversationId（排盘绑定场景），否则自动检测活跃对话
  let conversation;
  const specifiedConvId = (body.conversationId || '').trim();

  if (specifiedConvId) {
    const existing = getConversationById(specifiedConvId);
    if (existing) {
      conversation = existing;
    } else {
      // ID 不存在（异常情况），创建新对话兜底
      conversation = createConversation(userId);
      console.warn(`[AI Chat] conversationId ${specifiedConvId} not found, created new: ${conversation.id}`);
    }
  } else {
    conversation = getOrCreateActiveConversation(userId);
  }
  saveMessage(conversation.id, 'user', question);

  const historyMsgs = getRecentMessages(conversation.id, MAX_HISTORY);
  const openaiMsgs = toOpenAIMessages(historyMsgs);

  // ---- 4. 构造 AI 消息数组 ----
  const messages: Array<{ role: string; content: string }> = [];
  messages.push({ role: 'system', content: SYSTEM_PROMPT });

  const baziContext = (body.baziContext || '').trim();
  if (baziContext) {
    messages.push({
      role: 'system',
      content: `【当前排盘数据】\n${baziContext}\n\n请根据以上排盘数据回答用户的问题。`,
    });
  }

  // 历史对话（排除刚存入的最后一条 user 消息）
  const historyForAI = openaiMsgs.slice(0, -1);
  messages.push(...historyForAI);
  messages.push({ role: 'user', content: question });

  // ---- 5. 扣减积分（事务） ----
  const updatedUser = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: COST_PER_QUERY } },
      select: { id: true, credits: true },
    });
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -COST_PER_QUERY,
        balance: u.credits,
        type: 'consume',
        description: 'AI问答消耗 10 积分',
      },
    });
    return u;
  });

  console.log(`[Credits] user=${userId} cost=${COST_PER_QUERY} balance=${updatedUser.credits}`);

  // ---- 6. 调用 SiliconFlow 流式 API ----
  try {
    const apiResp = await fetch(`${SILICONFLOW_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        top_p: 0.7,
      }),
    });

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      console.error('[SiliconFlow] error:', apiResp.status, errText);
      saveMessage(conversation.id, 'assistant', `[API错误] ${apiResp.status}: ${errText}`);
      return NextResponse.json({ error: `AI服务异常 (${apiResp.status})` }, { status: 502 });
    }

    // ---- 7. SSE 流式转发 ----
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let buffer = ''; // 跨 chunk 行缓冲：SSE行可能跨多个read()chunk
        const reader = apiResp.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 追加到缓冲区并按换行符提取完整行
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // 最后一个元素可能是不完整的行，保留在buffer中
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;

              const data = trimmed.slice(5).trim();
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullContent += delta;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                  );
                }
              } catch {
                // 忽略非 JSON 行（如 : ping）
              }
            }
          }

          // 处理缓冲区中剩余的数据
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data:')) {
              const data = trimmed.slice(5).trim();
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullContent += delta;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                    );
                  }
                } catch { /* ignore */ }
              }
            }
          }

          // 发送结束标记
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

          // 存库
          if (fullContent.trim()) {
            saveMessage(conversation.id, 'assistant', fullContent.trim());
          }

          console.log(`[AI Stream] complete: ${fullContent.length} chars, ${fullContent.length > 0 ? 'OK' : 'EMPTY'}`);
        } catch (err: any) {
          console.error('[AI Stream] error:', err.message);
          const errMsg = '\n\n[错误] 回复可能不完整';
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
            );
          } catch { /* controller may already be closed */ }
          if (fullContent.trim()) {
            saveMessage(conversation.id, 'assistant', fullContent.trim() + errMsg);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('[AI Chat] fetch error:', err.message);
    saveMessage(conversation.id, 'assistant', `[系统错误] ${err.message}`);
    return NextResponse.json({ error: err.message || 'AI请求失败' }, { status: 500 });
  }
  } catch (err: any) {
    console.error('[AI Chat] unexpected error:', err.message);
    return NextResponse.json({ error: err.message || '服务器内部错误' }, { status: 500 });
  }
}
