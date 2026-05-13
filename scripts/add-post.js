#!/usr/bin/env node
/**
 * 添加新文章脚本
 * 用法：node scripts/add-post.js
 *
 * 交互式提问，自动创建所有必要文件并部署
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, "") // 移除中文
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "post-" + Date.now().toString(36);
}

async function main() {
  console.log("📝 添加新文章\n");

  const title = await ask("文章标题：");
  const description = await ask("文章描述：");
  const category = await ask("分类名称（如：溯源 / 杂谈 / 格局）：");
  const icon = await ask("图标 emoji（默认 📄）：") || "📄";
  const coverColor = await ask("封面色（默认 #6b21a8）：") || "#6b21a8";
  const tags = (await ask("标签（逗号分隔，如：易学,命理）：")).split(/[，,]/).map(s => s.trim()).filter(Boolean);

  const slug = slugify(title);
  console.log(`\n生成 slug: ${slug}`);

  const confirm = await ask("确认创建？(y/n)：");
  if (confirm.toLowerCase() !== "y") {
    console.log("已取消");
    rl.close();
    return;
  }

  // 创建目录
  const contentDir = path.join(__dirname, "..", "content", slug);
  const publicDir = path.join(__dirname, "..", "public", "content", slug);
  fs.mkdirSync(contentDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  // 创建 meta.json
  const meta = {
    title,
    date: new Date().toISOString().slice(0, 10),
    description,
    tags: tags.length ? tags : ["易学"],
    icon,
    coverColor,
    category,
  };
  fs.writeFileSync(path.join(contentDir, "meta.json"), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(publicDir, "meta.json"), JSON.stringify(meta, null, 2));

  // 创建 index.html 模板
  const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --gold: #d4a853;
            --gold-dim: rgba(212, 168, 83, 0.6);
            --text: #e8e4df;
            --text-dim: #9a9590;
            --border: rgba(212, 168, 83, 0.15);
        }
        * { box-sizing: border-box; }
        body {
            font-family: "Noto Serif SC", "Source Han Serif CN", "STSong", serif;
            background: transparent;
            color: var(--text);
            line-height: 1.9;
            margin: 0;
            padding: 20px;
        }
        h1 { text-align: center; color: var(--gold); font-size: 2em; margin-bottom: 30px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
        h2 { color: var(--gold); border-left: 4px solid #c9372c; padding-left: 15px; margin-top: 2.5em; margin-bottom: 1.2em; font-size: 1.35em; }
        p { margin-bottom: 1em; text-align: justify; }
        strong { color: #fff; font-weight: bold; }
        blockquote { border-left: 4px solid var(--gold); background: rgba(212,175,55,0.05); padding: 15px 20px; margin: 20px 0; border-radius: 0 6px 6px 0; font-style: italic; color: var(--text-dim); }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid var(--border); padding: 12px 15px; text-align: center; }
        th { background: rgba(212,175,55,0.1); color: var(--gold); font-weight: bold; }
        tr:nth-child(even) { background: rgba(255,255,255,0.02); }
        hr { border: 0; height: 1px; background: linear-gradient(to right, transparent, var(--border), transparent); margin: 2.5em 0; }
        .poem { text-align: center; font-size: 1.15em; line-height: 2.2; margin: 30px 0; padding: 25px; background: linear-gradient(135deg, rgba(212,175,55,0.08) 0%, transparent 100%); border-radius: 12px; border: 1px solid var(--border); color: var(--gold); }
        .highlight { color: #c9372c; font-weight: bold; }
    </style>
</head>
<body>

<h1>${icon} ${title}</h1>

<p>${description}</p>

<hr>

<!-- 在这里写你的文章内容 -->
<p>在这里写正文内容...</p>

</body>
</html>`;

  fs.writeFileSync(path.join(contentDir, "index.html"), htmlTemplate);
  fs.writeFileSync(path.join(publicDir, "index.html"), htmlTemplate);

  // 更新 _index.json
  const indexPath = path.join(__dirname, "..", "content", "_index.json");
  const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  indexData.posts.unshift(meta); // 新文章放最前面
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));

  const publicIndexPath = path.join(__dirname, "..", "public", "content", "_index.json");
  fs.writeFileSync(publicIndexPath, JSON.stringify(indexData, null, 2));

  console.log(`\n✅ 文章创建成功！`);
  console.log(`   目录: content/${slug}/`);
  console.log(`   编辑: content/${slug}/index.html`);
  console.log(`\n下一步：`);
  console.log(`   1. 编辑 content/${slug}/index.html 写文章内容`);
  console.log(`   2. 完成后运行: git add -A && git commit -m "feat: 添加${title}" && git push origin main`);
  console.log(`   3. 然后告诉我部署`);

  rl.close();
}

main().catch(console.error);
