/**
 * 文章同步脚本
 * 从 content/_index.json 同步文章到数据库
 * 用法: npm run sync
 */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CONTENT_DIR = path.join(process.cwd(), "content");
const INDEX_FILE = path.join(CONTENT_DIR, "_index.json");

async function syncPosts() {
  console.log("📝 开始同步文章到数据库...\n");

  // 读取 _index.json
  if (!fs.existsSync(INDEX_FILE)) {
    console.error("❌ 找不到 content/_index.json 文件");
    process.exit(1);
  }

  const raw = fs.readFileSync(INDEX_FILE, "utf-8");
  const { posts } = JSON.parse(raw);

  if (!Array.isArray(posts)) {
    console.error("❌ _index.json 格式错误：缺少 posts 数组");
    process.exit(1);
  }

  console.log(`📋 发现 ${posts.length} 篇文章\n`);

  let created = 0;
  let skipped = 0;

  for (const post of posts) {
    const { slug, title, description, date } = post;

    if (!slug || !title) {
      console.warn(`⚠️  跳过无效文章: ${JSON.stringify(post)}`);
      skipped++;
      continue;
    }

    const existing = await prisma.post.findUnique({ where: { slug } });

    if (existing) {
      // 更新已存在的文章
      await prisma.post.update({
        where: { slug },
        data: { title, description, date },
      });
      console.log(`🔄 更新: ${title} (${slug})`);
    } else {
      // 创建新文章
      await prisma.post.create({
        data: {
          slug,
          title,
          description: description || "",
          date: date || new Date().toISOString().split("T")[0],
          published: true,
        },
      });
      console.log(`✅ 新增: ${title} (${slug})`);
      created++;
    }
  }

  // 检查是否有数据库中有但 JSON 中没有的文章（软删除提示）
  const dbPosts = await prisma.post.findMany();
  const jsonSlugs = posts.map((p) => p.slug);
  const orphanPosts = dbPosts.filter((p) => !jsonSlugs.includes(p.slug));

  if (orphanPosts.length > 0) {
    console.log(`\n⚠️  数据库中存在但 JSON 中已删除的文章:`);
    for (const p of orphanPosts) {
      console.log(`   - ${p.title} (${p.slug})`);
    }
  }

  console.log(`\n✨ 同步完成！新增 ${created} 篇，更新 ${posts.length - created - skipped} 篇`);
}

syncPosts()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ 同步失败:", e);
    process.exit(1);
  });
