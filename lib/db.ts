import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

// 生成 MySQL DATETIME 格式字符串（防止 mysql2 将 Date 序列化为 Unix 时间戳数字）
function mysqlNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

// AI 聊天数据库连接（MySQL）
const MYSQL_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Bazi2026!Mysql',
  database: 'ai_chat_db',
  charset: 'utf8mb4',
};

let pool: mysql.Pool | null = null;

export async function getDb(): Promise<mysql.Pool> {
  if (!pool) {
    pool = await mysql.createPool({
      ...MYSQL_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 5,
      idleTimeout: 60000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
    // 初始化表结构
    await initTables(pool);
  }
  return pool;
}

async function initTables(pool: mysql.Pool): Promise<void> {
  const conn = await pool.getConnection();
  try {
    // 会话表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(40) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        title VARCHAR(200) DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_conversations_user (user_id, updated_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 消息表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id VARCHAR(40) NOT NULL,
        user_id VARCHAR(50) NOT NULL DEFAULT '',
        role ENUM('system','user','assistant') NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_messages_conversation (conversation_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 排盘信息表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS bazi_charts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        conversation_id VARCHAR(40) NOT NULL UNIQUE,
        gender CHAR(1) NOT NULL,
        calendar_type VARCHAR(10) NOT NULL DEFAULT 'solar',
        birth_year INT NOT NULL,
        birth_month INT NOT NULL,
        birth_day INT NOT NULL,
        birth_hour INT NOT NULL DEFAULT 0,
        mode INT NOT NULL DEFAULT 1,
        bazi_data JSON NOT NULL,
        dayun_data JSON,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_bazi_charts_user (user_id, created_at DESC),
        INDEX idx_bazi_charts_conv (conversation_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    conn.release();
  }
}

/* ==================== Conversation ==================== */

export interface DbConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export async function createConversation(userId: string): Promise<DbConversation> {
  const db = await getDb();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const now = mysqlNow();
  await db.execute(
    'INSERT INTO conversations (id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [id, userId, now, now]
  );
  return { id, user_id: userId, title: '', created_at: new Date(), updated_at: new Date() };
}

export async function getOrCreateActiveConversation(userId: string): Promise<DbConversation> {
  const db = await getDb();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const [rows] = await db.execute(
    "SELECT * FROM conversations WHERE user_id = ? AND updated_at > ? ORDER BY updated_at DESC LIMIT 1",
    [userId, fiveMinAgo]
  );
  const arr = rows as DbConversation[];
  if (arr && arr.length > 0) return arr[0];
  return createConversation(userId);
}

/* ==================== Message ==================== */

export interface DbMessage {
  id: number;
  conversation_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function saveMessage(conversationId: string, role: string, content: string, userId: string = ''): Promise<void> {
  const db = await getDb();
  const now = mysqlNow();
  await db.execute(
    'INSERT INTO messages (conversation_id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
    [conversationId, userId, role, content, now]
  );
  await db.execute(
    'UPDATE conversations SET updated_at = ? WHERE id = ?',
    [now, conversationId]
  );
}

export async function getRecentMessages(conversationId: string, limit: number = 20): Promise<DbMessage[]> {
  const db = await getDb();
  const [rows] = await db.execute(
    `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ${limit}`,
    [conversationId]
  );
  return rows as DbMessage[];
}

export function toOpenAIMessages(dbMsgs: DbMessage[]): ChatMessage[] {
  return dbMsgs.map(m => ({ role: m.role as ChatMessage['role'], content: m.content }));
}

/* ==================== Bazi Chart ==================== */

export interface DbBaziChart {
  id: number;
  user_id: string;
  conversation_id: string;
  gender: string;
  calendar_type: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  mode: number;
  bazi_data: any;   // MySQL JSON → JS object or string
  dayun_data: any;
  created_at: Date;
}

export async function saveBaziChart(userId: string, data: {
  gender: string;
  calendarType: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  mode: number;
  baziData: object;
  dayunData?: object | null;
}): Promise<string> {
  const db = await getDb();

  const conv = await createConversation(userId);

  await db.execute(`
    INSERT INTO bazi_charts (user_id, conversation_id, gender, calendar_type,
      birth_year, birth_month, birth_day, birth_hour, mode, bazi_data, dayun_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    userId, conv.id,
    data.gender, data.calendarType,
    data.birthYear, data.birthMonth, data.birthDay, data.birthHour,
    data.mode,
    JSON.stringify(data.baziData),
    data.dayunData ? JSON.stringify(data.dayunData) : null,
  ]);

  return conv.id;
}

export async function getLatestChart(userId: string): Promise<DbBaziChart | undefined> {
  const db = await getDb();
  const [rows] = await db.execute(
    'SELECT * FROM bazi_charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  const arr = rows as DbBaziChart[];
  return arr && arr.length > 0 ? arr[0] : undefined;
}

export async function getChartByConvId(conversationId: string): Promise<DbBaziChart | undefined> {
  const db = await getDb();
  const [rows] = await db.execute(
    'SELECT * FROM bazi_charts WHERE conversation_id = ?',
    [conversationId]
  );
  const arr = rows as DbBaziChart[];
  return arr && arr.length > 0 ? arr[0] : undefined;
}

export async function getConversationById(id: string): Promise<DbConversation | undefined> {
  const db = await getDb();
  const [rows] = await db.execute(
    'SELECT * FROM conversations WHERE id = ?',
    [id]
  );
  const arr = rows as DbConversation[];
  return arr && arr.length > 0 ? arr[0] : undefined;
}
