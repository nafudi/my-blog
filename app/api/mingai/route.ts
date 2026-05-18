import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 45000;
const PROCESS_TIMEOUT = 40000;

// ==================== 空亡计算 ====================
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 旬首地支 -> 空亡地支
const XUNSHOU_KONG: Record<string, [string, string]> = {
  '子': ['戌', '亥'], // 甲子旬
  '寅': ['申', '酉'], // 甲戌旬
  '辰': ['午', '未'], // 甲申旬
  '午': ['辰', '巳'], // 甲午旬
  '申': ['寅', '卯'], // 甲辰旬
  '戌': ['子', '丑'], // 甲寅旬
};

/**
 * 根据日干支计算空亡
 * @param dayGz 日干支，如 "庚辰"
 * @returns 空亡字符串，如 "申酉"，或 "-" 表示无空亡
 */
function calcKongWang(dayGz: string): string {
  if (!dayGz || dayGz.length < 2) return '-';

  const dayTiangan = dayGz[0];
  const dayDizhi = dayGz[1];

  // 找到日干支在六十甲子表中的位置
  let pos = -1;
  for (let i = 0; i < 60; i++) {
    const tgIdx = i % 10;
    const dzIdx = i % 12;
    if (TIANGAN[tgIdx] === dayTiangan && DIZHI[dzIdx] === dayDizhi) {
      pos = i;
      break;
    }
  }

  if (pos === -1) return '-';

  // 计算旬首地支
  const xunshouDzIdx = (pos % 60) % 12; // 用 pos % 12 来确定地支
  // 甲子旬: 0-9 -> 子, 甲戌旬: 10-19 -> 寅, 以此类推
  const xunIdx = Math.floor((pos % 60) / 10);
  const xunshouDz = XUNSHOU_KONG[DIZHI[xunIdx * 2] || DIZHI[0]];
  if (!xunshouDz) return '-';

  return xunshouDz[0] + xunshouDz[1];
}

/**
 * 向 structuredContent 的四柱数据注入空亡
 */
function injectKongWang(structuredContent: any): any {
  if (!structuredContent || !structuredContent.四柱 || !Array.isArray(structuredContent.四柱)) {
    return structuredContent;
  }

  // 从日柱获取日干支
  const riZhu = structuredContent.四柱.find((p: any) => p.柱 === '日柱');
  if (!riZhu || !riZhu.干支) return structuredContent;

  const kongWang = calcKongWang(riZhu.干支);

  // 注入到每个柱
  structuredContent.四柱 = structuredContent.四柱.map((p: any) => ({
    ...p,
    kongwang: kongWang,
    '空亡': kongWang,
  }));

  return structuredContent;
}

// ==================== MCP 请求逻辑 ====================

function mcpRequest(proc: any, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = '';
    let resolved = false;

    // 设置超时
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill();
        reject(new Error('MCP request timeout'));
      }
    }, timeoutMs);

    proc.stdout.on('data', (d: Buffer) => {
      buf += d.toString();
      if (!resolved) {
        try {
          JSON.parse(buf.trim());
          resolved = true;
          clearTimeout(timer);
          resolve(buf.trim());
        } catch { }
      }
    });

    proc.on('error', (err: Error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        reject(err);
      }
    });
  });
}

function mcpWrite(proc: any, data: string) {
  if (proc.stdin && !proc.stdin.destroyed) {
    proc.stdin.write(data + '\n');
  }
}

export async function POST(req: Request) {
  // 设置整体请求超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const body = await req.json();
    const { tool, args } = body;

    if (!tool) {
      return NextResponse.json({ error: 'Missing tool name' }, { status: 400 });
    }

    console.log('[mingai] calling', tool);

    // 启动 MCP 进程
    const proc = spawn('/usr/bin/npx', ['-y', '@mingai/mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: '/usr/local/bin:/usr/bin:/bin',
        NODE_OPTIONS: '--max-old-space-size=512'
      },
    });

    let stderrAll = '';
    proc.stderr.on('data', (d: Buffer) => {
      stderrAll += d.toString();
      if (stderrAll.length > 10000) {
        stderrAll = stderrAll.slice(-5000);
      }
    });

    // 确保进程最终被清理
    const cleanup = () => {
      try {
        if (!proc.killed) {
          proc.kill('SIGTERM');
          setTimeout(() => {
            if (!proc.killed) proc.kill('SIGKILL');
          }, 2000);
        }
      } catch { }
    };

    proc.on('close', cleanup);
    proc.on('error', cleanup);

    // Step 1: Initialize
    const initMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'my-blog', version: '1.0' }
      },
    });

    mcpWrite(proc, initMsg);

    const initResponse = await mcpRequest(proc, PROCESS_TIMEOUT);
    const initData = JSON.parse(initResponse);

    if (initData.error) {
      proc.kill();
      console.error('[mingai] init error:', initData.error);
      return NextResponse.json(
        { error: initData.error, details: 'MCP initialization failed' },
        { status: 400 }
      );
    }

    console.log('[mingai] init ok:', initData.result?.serverInfo?.name);

    // Step 2: Call tool
    const callMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: tool, arguments: args },
    });

    mcpWrite(proc, callMsg);

    const callResponse = await mcpRequest(proc, PROCESS_TIMEOUT);
    const callData = JSON.parse(callResponse);

    proc.kill();

    if (callData.error) {
      console.error('[mingai] call error:', callData.error);
      return NextResponse.json(
        { error: callData.error },
        { status: 400 }
      );
    }

    const content = callData.result?.content || [];
    const text = content[0]?.text || '';

    // 处理 structuredContent：注入空亡数据
    let structuredContent = callData.result?.structuredContent || null;
    if (structuredContent && (tool === 'bazi' || tool === 'bazi_pillars_resolve')) {
      structuredContent = injectKongWang(structuredContent);
    }

    return NextResponse.json({
      text,
      structuredContent,
    });

  } catch (err: any) {
    console.error('[mingai] error:', err.message || err);

    if (err.message === 'MCP request timeout' || err.name === 'AbortError') {
      return NextResponse.json(
        { error: '请求超时，请稍后重试' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
