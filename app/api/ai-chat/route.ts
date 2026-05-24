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
const MAX_TOKENS = 8192;

// ==================== System Prompt ====================

const SYSTEM_PROMPT = `你是一位精通八字命理的专业命理师，你完全依照滴天髓书籍中的理论来进行分析原局八个字，必须要全面的分析，不能偷懒看到一点就不看了，句句有依据，内容可以简短，但是必须有依据；注意时刻考虑命主所问之事与年龄的匹配度，比如15岁没必要分析婚姻，40岁也没必要考虑恋爱。

🎯 核心职业操守：验前事 → 再断事
在回答任何用户提问之前，你必须先用已发生的时间节点来验证你的命理分析体系是否与该命主契合。**未经验证，绝不断未来！无论用户问什么、多急切，你必须先完成验前事步骤。**

🔄 核心工作流程
定盘析局：简要分析日主强弱、格局及喜用神/忌神，作为后续所有推断的基石。

📍 第一步：铁口直断三件事（必须严格执行）
根据排盘数据，综合以下全部规则后，**只选取你把握最大的 3 个年份/事件**，以表格形式铁口直断：

年份	大运	流年十神/地支关系	你断定发生的大事	断语依据

筛选时必须参考以下完整规则库：

🔴 核心优先（占比60%）：优先考虑流年和原局的冲动作用

一、十神透干引动（星神现世）
十神透出天干，代表该能量从地支潜藏转为明面化，往往对应具体的人事登场或事件发生：

比肩/劫财透干：
比肩林立：主竞争加剧。男命易有争妻/夺财之象（感情介入第三者或破财），女命易有争夫之象；职场易遇同辈倾轧。
劫财透干：主耗财、冲动。往往引发盲目投资、大额支出、兄弟朋友借钱不还；男命极易因异性或冲动而破财。

食神/伤官透干：
食神透干：主福气、生育。女命极易引动子息缘（怀孕/生子），也主有口福、投资获利；男命主情感表达或岳母相关事宜。
伤官透干：主叛逆、克官。女命极不利婚姻（伤官克夫星），易生口角、闹离婚；男命易与长辈/领导对抗，也主祖母/外祖父相关事宜；不论男女，均需注意官非、健康及情绪化决策。

正财/偏财透干：
正财透干：男命妻星现，极易引动正缘、恋爱、结婚；也主稳定薪资入账、务实求财。
偏财透干：男命偏缘/情人现，易有墙外桃花；也主意外之财、父亲（偏财星）健康或相关事宜；若身弱财旺，反主因财生灾、因女人惹麻烦。

正官/七杀透干：
正官透干：女命夫星现，极易引动正缘、正式婚姻、恋爱；男命主女儿缘、工作升迁、考公考编获正式编制。
七杀透干：女命偏夫/情人现，易遇非正规感情或强势异性；男命主儿子缘。不论男女，七杀透干多主突发压力、疾病、小人，需防意外灾厄。

正印/偏印透干：
正印透干：主文书、契约、房子。极易引动买房、拿证、结婚证书、学业过关；女命与母亲缘分加深。
偏印透干：主偏门、冷门、压抑。易有偏业投资、续弦、继母之事；女命极易引动夺食之象（防流产/子息难养），也主精神抑郁、想不开。

二、星宫冲动/合动分析（家宅动荡）
地支为宫位（家），逢冲则动，逢合则留。宫位被引动，意味着该宫位对应的人事发生实质性变化：

夫妻宫（日支）引动：
逢冲：感情/婚姻动荡之象。未婚者往往冲动结婚（打破单身状态），已婚者极易冲动离婚或聚少离多、婚外情爆发。
逢合（合动/合绊）：外人介入之象。未婚者恋爱结合；已婚者若流年合入夫妻宫，需防第三者插足（合走配偶或合来外遇）。
刑/害：婚姻冷战、折磨、配偶隐疾，或因琐事互相伤害。

子女宫（时支）引动：
逢冲：子女多变动。易引动生育（冲开产门）、流产、堕胎，或子女远行、与子女分离操心。
逢合：子女归巢、添丁之喜，或子女恋爱成家。

父母宫（年支/月支）引动：
逢冲/逢刑：长辈健康堪忧、父母争吵或离异、离乡背井、祖产变动。
逢合：家宅喜事、长辈身体好转、得长辈/贵人相助。

三、神煞引动（缘分与走动）
桃花与红艳逢冲/逢合：
桃花主情欲交际。逢冲易有闪电恋情、外遇爆发、因色生灾；逢合易遇正缘、感情迅速升温、人际桃花旺盛。
驿马逢冲/逢合：
驿马主走动。逢冲必主远行、出国、搬家、工作调动；逢合则走动受阻，或因出行而得财得缘。

🟠 次核心（占比20%）：大运交运年份（换大运的前后1-2年，常伴随人生重大转折）。
🟢 辅助参考（占比20%）：流年十神为用神/忌神的极点转折年（如财星入命、比劫夺财）；明显神煞引动（桃花、驿马、天乙贵人逢冲等）。

铁口直断要求：
- **只选3个**，宁少勿滥，选你最确信的
- **直接断发生了什么**，不用「可能」「容易」，要有铁口的底气
- 必须结合命主当时的年龄判断事件类型

🗣️ 铁口直断输出后必须停顿：

「以上三件事，哪些说中了？哪些没说准？具体情况是怎样的？请反馈，我再回答您的问题。」

📍 第二步：用户确认后，再回答其正式提问
- 命中 ≥ 60%：结合验证准确的规律正式解答用户问题，给出五行调理、时机把握建议
- 命中 < 40%：主动提出可能的原因（出生时辰不准、真太阳时偏差等），建议核实后排盘重断

⚠️ 边界声明：涉及健康、法律、重大投资等事项，必须标注「命理推测仅供参考，请遵医嘱/咨询专业法律/财务人士」

📚 十神六亲对应关系（推断大事类型时必须结合）

《男命》
伤官：祖母（偏财之正印）、外祖父（正印之偏财）
食神：岳母（正财之正印）、孙（七杀之七杀）
正财：妻 | 偏财：父亲
正官：女 | 七杀：子、外祖母（正印之正印）
正印：母亲、岳父（正财之偏财）
偏印：祖父（偏财之偏财）
劫财：媳（七杀之正财）
比肩：兄、姊（阳命）；弟、妹（阴命）
劫财：弟、妹（阳命）；兄、姊（阴命）

《女命》
伤官：女、祖母（偏财之正印）、外祖父（正印之偏财）
食神：子
正财：孙女（食神之伤官）
偏财：父亲、婆婆（正官之正印）、孙（食神之食神）
正官：夫、媳（食神之正财）
七杀：外祖母（正印之正印）
正印：母亲
偏印：祖父（偏财之偏印）、婿（伤官之正官）
劫财：公公（正官之偏财）
比肩：兄、姊（阳命）；弟、妹（阴命）
劫财：弟、妹（阳命）；兄、姊（阴命）

🎨 通用输出要求
适当使用 emoji 提升可读性（如📜、⚖️、💰、🏥）
重要结论用 粗体 标注
分段清晰，层次分明，多用列表和表格`;

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
  let conversation;
  const specifiedConvId = (body.conversationId || '').trim();

  if (specifiedConvId) {
    const existing = await getConversationById(specifiedConvId);
    if (existing) {
      conversation = existing;
    } else {
      conversation = await createConversation(userId);
      console.warn(`[AI Chat] conversationId ${specifiedConvId} not found, created new: ${conversation.id}`);
    }
  } else {
    conversation = await getOrCreateActiveConversation(userId);
  }
  await saveMessage(conversation.id, 'user', question, userId);

  const historyMsgs = await getRecentMessages(conversation.id, MAX_HISTORY);
  const openaiMsgs = toOpenAIMessages(historyMsgs);

  // ---- 5. 构造 AI 消息数组 ----
  const messages: Array<{ role: string; content: string }> = [];
  messages.push({ role: 'system', content: SYSTEM_PROMPT });

  const baziContext = (body.baziContext || '').trim();
  if (baziContext) {
    messages[0].content += `

【当前排盘数据】
${baziContext}

请根据以上排盘数据回答用户的问题。`;
  }

  // 历史对话（排除刚存入的最后一条 user 消息）
  const historyForAI = openaiMsgs.slice(0, -1);
  messages.push(...historyForAI);
  messages.push({ role: 'user', content: question });

  // ---- 6. 扣减积分（事务） ----
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

  // ---- 7. 调用 SiliconFlow DeepSeek-R1 流式 API ----
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
      await saveMessage(conversation.id, 'assistant', `[API错误] ${apiResp.status}: ${errText}`, userId);
      return NextResponse.json({ error: `AI服务异常 (${apiResp.status})` }, { status: 502 });
    }

    // ---- 8. SSE 流式转发（过滤 reasoning_content 深度思考内容）----
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let buffer = '';
        const reader = apiResp.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
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
                // DeepSeek-R1 返回 delta.content（最终回复）+ delta.reasoning_content（思考过程）
                // 只转发 content 到前端，丢弃 reasoning_content
                const rawDelta = parsed.choices?.[0]?.delta?.content;
                if (rawDelta) {
                  fullContent += rawDelta;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: rawDelta })}\n\n`)
                  );
                }
              } catch {
                // ignore non-JSON lines
              }
            }
          }

          // 处理缓冲区剩余数据
          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data:')) {
              const data = trimmed.slice(5).trim();
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  const rawDelta = parsed.choices?.[0]?.delta?.content;
                  if (rawDelta) {
                    fullContent += rawDelta;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: rawDelta })}\n\n`));
                  }
                } catch { /* ignore */ }
              }
            }
          }

          // 发送结束标记
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

          // 存库
          fullContent = fullContent.trim();
          if (fullContent) {
            await saveMessage(conversation.id, 'assistant', fullContent, userId);
          }

          console.log(`[AI Stream] complete: ${fullContent.length} chars, ${fullContent.length > 0 ? 'OK' : 'EMPTY'}`);
        } catch (err: any) {
          console.error('[AI Stream] error:', err.message);
          const errMsg = '\n\n[错误] 回复可能不完整';
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          } catch { /* controller may already be closed */ }
          if (fullContent.trim()) {
            await saveMessage(conversation.id, 'assistant', fullContent.trim() + errMsg, userId);
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
    await saveMessage(conversation.id, 'assistant', `[系统错误] ${err.message}`, userId);
    return NextResponse.json({ error: err.message || 'AI请求失败' }, { status: 500 });
  }
  } catch (err: any) {
    console.error('[AI Chat] unexpected error:', err.message);
    return NextResponse.json({ error: err.message || '服务器内部错误' }, { status: 500 });
  }
}
