from PIL import Image, ImageDraw, ImageFont
import json, os, subprocess, tempfile, sys

# ============================================================
# 0. 确保 lunar-python 已安装
# ============================================================
try:
    from lunar_python import Solar, EightChar
except ImportError:
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "lunar-python"],
        check=True, capture_output=True
    )
    from lunar_python import Solar, EightChar

# 导入神煞计算模块
sys.path.insert(0, r'C:\Users\Administrator\WorkBuddy\2026-05-14-task-11')
from shensha_full import calc_shensha, ShenShaFull

# ============================================================
# 1. Node.js 获取八字基础数据（含季节）
# ============================================================
node_script = """
const lunisolar = require('lunisolar').default || require('lunisolar');
const { char8ex } = require('@lunisolar/plugin-char8ex');
lunisolar.extend(char8ex);

const ls = lunisolar('1998-01-22 04:00');
const c8ex = ls.char8ex(1);

const pillars = ['year','month','day','hour'];
const bazi = {};
const hideGan = {};
const naYin = {};
const shiShenGan = {};
const shiShenZhi = {};
const xunKong = {};

pillars.forEach(p => {
  const pillar = c8ex[p];
  bazi[p] = { gan: pillar.stem.name, zhi: pillar.branch.name };
  hideGan[p] = pillar.branch.hiddenStems ? pillar.branch.hiddenStems.map(s => s.name) : [];
  naYin[p] = pillar.takeSound || '';
  shiShenGan[p] = pillar.stemTenGod ? pillar.stemTenGod.name : '';
  shiShenZhi[p] = pillar.branchTenGod ? pillar.branchTenGod.map(t => t.name) : [];
  xunKong[p] = pillar.missing ? pillar.missing.map(m => m.name).join('') : '';
});

// 胎元命宫身宫
const extra = {
  taiYuan: { ganZhi: c8ex.embryo().toString() },
  mingGong: { ganZhi: c8ex.ownSign().toString() },
  shenGong: { ganZhi: c8ex.bodySign().toString() }
};

// 季节（lunisolar 内置 API）
const season = ls.getSeason();

// 大运 - lunar-javascript
const { Solar } = require('lunar-javascript');
const solar = Solar.fromYmdHms(1998, 1, 22, 4, 0, 0);
const lunar2 = solar.getLunar();
const bazi2 = lunar2.getEightChar();
const yun = bazi2.getYun(1);
const daYunArr = yun.getDaYun();

const yunData = {
  startAge: yun.getStartYear() + '年' + yun.getStartMonth() + '个月' + yun.getStartDay() + '天',
  startSolarDate: yun.getStartSolar().toString(),
  isForward: yun.isForward(),
  daYun: []
};

for (let i = 1; i < daYunArr.length; i++) {
  const dy = daYunArr[i];
  const liuNian = dy.getLiuNian();
  const daYunObj = {
    index: i, ganZhi: dy.getGanZhi(),
    startYear: dy.getStartYear(), endYear: dy.getEndYear(),
    startAge: dy.getStartAge(), liuNian: []
  };
  for (let j = 0; j < liuNian.length; j++) {
    const ln = liuNian[j];
    const liuYue = ln.getLiuYue();
    const lnObj = {
      year: ln.getYear(), ganZhi: ln.getGanZhi(), age: ln.getAge(),
      liuYue: []
    };
    for (let k = 0; k < liuYue.length; k++) {
      const ly = liuYue[k];
      lnObj.liuYue.push({month: ly.getMonthInChinese(), ganZhi: ly.getGanZhi()});
    }
    daYunObj.liuNian.push(lnObj);
  }
  yunData.daYun.push(daYunObj);
}

const result = {
  bazi, hideGan, naYin,
  shiShenGan, shiShenZhi,
  xunKong,
  season,
  riGan: bazi.day.gan,
  extra, yun: yunData
};
console.log(JSON.stringify(result));
"""

tmpdir = tempfile.gettempdir()
node_path = os.path.join(tmpdir, 'bazi_data_v6.js')
with open(node_path, 'w', encoding='utf-8') as f:
    f.write(node_script)

node_exe = r'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.12.0\node.exe'
env = os.environ.copy()
env.pop('NODE_OPTIONS', None)
env['NODE_PATH'] = r'C:\Users\Administrator\WorkBuddy\2026-05-14-task-11\node_modules'

result = subprocess.run(
    [node_exe, node_path],
    capture_output=True, text=True, cwd=r'C:\Users\Administrator\WorkBuddy\2026-05-14-task-11',
    env=env
)
if result.returncode != 0:
    print("STDERR:", result.stderr)
    raise RuntimeError(f"Node script failed: {result.returncode}")
data = json.loads(result.stdout)
print("季节:", data.get("season"))

# ============================================================
# 2. 用 shensha_full.py 计算神煞（替换 char8ex 的 gods）
# ============================================================
PILLAR_KEYS = ['year', 'month', 'day', 'hour']

raw_shensha = calc_shensha(
    year=1998, month=1, day=22, hour=4, gender=1
)
print("Python 神煞计算结果:", list(raw_shensha.keys()))

# 吉凶等级映射
LUCK_MAP = {
    '天乙贵人': 1, '太极贵人': 1, '文昌贵人': 1, '福星贵人': 1,
    '天厨贵人': 1, '天官贵人': 1, '国印贵人': 1,
    '天德': 1, '月德': 1, '天赦': 1, '天医': 1,
    '红鸾': 1, '天喜': 1, '禄神': 0, '金舆': 0,
    '驿马': 0, '华盖': 0, '将星': 0, '桃花': 0,
    '劫煞': -1, '灾煞': -1, '亡神': -1,
    '勾神': -1, '绞神': -1,
    '孤辰': -1, '寡宿': -1, '元辰': -1,
    '魁罡': -1, '羊刃': -1, '红艳煞': -1, '流霞': -1,
    '十恶大败': -1, '自缢': -1, '水厄': -1,
    '四废': -1, '童子煞': -1,
}

# 将 flat dict 按柱分配
shen_sha_by_pillar = {p: [] for p in PILLAR_KEYS}

for sha_name, sha_value in raw_shensha.items():
    if sha_value == '是':
        # 二元神煞，挂到日柱
        luck = LUCK_MAP.get(sha_name, 0)
        shen_sha_by_pillar['day'].append({'name': sha_name, 'luck': luck})
    else:
        # 解析关联地支（支持 / 分隔）
        zhi_list = sha_value.split('/') if '/' in sha_value else [sha_value]
        for p in PILLAR_KEYS:
            if data['bazi'][p]['zhi'] in zhi_list:
                luck = LUCK_MAP.get(sha_name, 0)
                shen_sha_by_pillar[p].append({'name': sha_name, 'luck': luck})

data['shenSha'] = shen_sha_by_pillar

# 验证：打印每柱的神煞
for p in PILLAR_KEYS:
    names = [s['name'] for s in shen_sha_by_pillar[p]]
    print(f"  {p}柱神煞: {', '.join(names) if names else '无'}")

# ============================================================
# 3. 十二长生计算
# ============================================================
CHANG_SHENG_ORDER = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养']
YANG_START = {'甲': '亥', '丙': '寅', '戊': '寅', '庚': '巳', '壬': '申'}
YIN_START = {'乙': '午', '丁': '酉', '己': '酉', '辛': '子', '癸': '卯'}
ZHI_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

def get_changsheng(gan, zhi):
    if gan in YANG_START:
        start_idx = ZHI_ORDER.index(YANG_START[gan])
        zhi_idx = ZHI_ORDER.index(zhi)
        return CHANG_SHENG_ORDER[(zhi_idx - start_idx) % 12]
    else:
        start_idx = ZHI_ORDER.index(YIN_START[gan])
        zhi_idx = ZHI_ORDER.index(zhi)
        return CHANG_SHENG_ORDER[(start_idx - zhi_idx) % 12]

ri_gan = data['riGan']
pillar_names = ["年柱", "月柱", "日柱", "时柱"]

xing_yun = []
zi_zuo = []
for p in PILLAR_KEYS:
    gz = data['bazi'][p]
    xing_yun.append(get_changsheng(ri_gan, gz['zhi']))
    zi_zuo.append(get_changsheng(gz['gan'], gz['zhi']))

# ============================================================
# 4. 配色与字体
# ============================================================
BG = "#faf6f1"
CARD_BG = "#ffffff"
CARD_BORDER = "#d4c5b0"
TEXT_DARK = "#2c2416"
TEXT_GOLD = "#8b6914"
TEXT_DIM = "#8a7e6b"
HEADER_BG = "#f5efe6"
GANZHI_BG = "#2c2c2c"

WU_XING_COLOR = {
    "木": "#2e7d32", "火": "#c62828", "土": "#8d6e63",
    "金": "#f9a825", "水": "#1565c0",
}
GAN_WU_XING = {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火",
    "戊": "土", "己": "土", "庚": "金", "辛": "金",
    "壬": "水", "癸": "水",
}
ZHI_WU_XING = {
    "寅": "木", "卯": "木", "巳": "火", "午": "火",
    "辰": "土", "戌": "土", "丑": "土", "未": "土",
    "申": "金", "酉": "金", "子": "水", "亥": "水",
}

def get_gan_color(gan):
    return WU_XING_COLOR.get(GAN_WU_XING.get(gan, ""), TEXT_DARK)

def get_zhi_color(zhi):
    return WU_XING_COLOR.get(ZHI_WU_XING.get(zhi, ""), TEXT_DARK)

SHEN_SHA_COLORS = {1: "#2e7d32", 0: "#8a7e6b", -1: "#c62828"}

font_paths = [
    "C:/Windows/Fonts/msyh.ttc",
    "C:/Windows/Fonts/simhei.ttf",
    "C:/Windows/Fonts/simsun.ttc",
]
font_large = None
for fp in font_paths:
    if os.path.exists(fp):
        font_large = ImageFont.truetype(fp, 26)
        font_mid = ImageFont.truetype(fp, 18)
        font_small = ImageFont.truetype(fp, 14)
        font_tiny = ImageFont.truetype(fp, 12)
        font_title = ImageFont.truetype(fp, 30)
        font_ganzhi_big = ImageFont.truetype(fp, 48)
        break
if not font_large:
    font_large = ImageFont.load_default()
    font_mid = font_small = font_tiny = font_title = font_ganzhi_big = font_large

# ============================================================
# 5. 画布
# ============================================================
W, H = 1400, 1600
img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

def draw_rounded_rect(x, y, w, h, r, fill, outline=None, width=1):
    draw.rounded_rectangle([x, y, x+w, y+h], radius=r, fill=fill, outline=outline, width=width)

def get_text_size(text, font):
    bbox = draw.textbbox((0,0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def draw_center_text(x, y, text, font, fill):
    tw, th = get_text_size(text, font)
    draw.text((x - tw//2, y - th//2), text, font=font, fill=fill)

# ============================================================
# 6. 标题
# ============================================================
draw_center_text(W//2, 30, "八 字 排 盘", font_title, TEXT_GOLD)
sub = f"{data['extra']['mingGong']['ganZhi']}命宫  {data['season']}季出生"
draw_center_text(W//2, 62, sub, font_small, TEXT_DIM)

# ============================================================
# 7. 表格
# ============================================================
margin = 40
label_w = 70
table_x = margin + label_w
table_w = W - margin * 2 - label_w
col_w = table_w // 4
table_y = 90

row_header_h = 36
row_zhuXing_h = 32
row_ganzhi_h = 140
row_canggan_h = 70
row_fuxing_h = 70
row_nayin_h = 32
row_xingyun_h = 32
row_zizuo_h = 32
row_xunkong_h = 32
row_shensha_h = 160

table_h = (row_header_h + row_zhuXing_h + row_ganzhi_h + row_canggan_h +
           row_fuxing_h + row_nayin_h + row_xingyun_h + row_zizuo_h +
           row_xunkong_h + row_shensha_h)

draw_rounded_rect(margin, table_y, label_w + table_w, table_h, 8, CARD_BG, CARD_BORDER, 2)

for i in range(1, 5):
    x = table_x + i * col_w
    draw.line([(x, table_y), (x, table_y + table_h)], fill=CARD_BORDER, width=1)

row_heights = [row_header_h, row_zhuXing_h, row_ganzhi_h, row_canggan_h,
               row_fuxing_h, row_nayin_h, row_xingyun_h, row_zizuo_h,
               row_xunkong_h, row_shensha_h]
y = table_y
for i in range(len(row_heights) - 1):
    y += row_heights[i]
    draw.line([(margin, y), (margin + label_w + table_w, y)], fill=CARD_BORDER, width=1)

header_y2 = table_y + row_header_h
draw.rectangle([margin+1, table_y+1, margin+label_w+table_w-1, header_y2-1], fill=HEADER_BG)

# 行标签
labels_data = [
    ("日期", row_header_h), ("主星", row_zhuXing_h),
    ("天干", row_ganzhi_h // 2), ("地支", row_ganzhi_h // 2),
    ("藏干", row_canggan_h), ("副星", row_fuxing_h),
    ("纳音", row_nayin_h), ("星运", row_xingyun_h),
    ("自坐", row_zizuo_h), ("空亡", row_xunkong_h), ("神煞", row_shensha_h),
]
label_y = table_y
for label, rh in labels_data:
    cy = label_y + rh // 2
    draw_center_text(margin + label_w // 2, cy, label, font_small, TEXT_DIM)
    label_y += rh

for i, name in enumerate(pillar_names):
    cx = table_x + i * col_w + col_w // 2
    draw_center_text(cx, table_y + row_header_h // 2, name, font_mid, TEXT_GOLD)

# 各柱数据
for i, p in enumerate(PILLAR_KEYS):
    cx = table_x + i * col_w + col_w // 2
    gz = data['bazi'][p]
    gan, zhi = gz['gan'], gz['zhi']

    # 主星
    y = table_y + row_header_h + row_zhuXing_h // 2
    draw_center_text(cx, y, data['shiShenGan'][p], font_small, TEXT_DIM)

    # 天干+地支圆角框
    box_x = table_x + i * col_w + 8
    box_w = col_w - 16
    box_y = table_y + row_header_h + row_zhuXing_h + 6
    box_h = row_ganzhi_h - 12
    draw_rounded_rect(box_x, box_y, box_w, box_h, 12, GANZHI_BG, None, 0)
    draw_center_text(box_x + box_w // 2, box_y + box_h // 4 + 2, gan, font_ganzhi_big, get_gan_color(gan))
    draw_center_text(box_x + box_w // 2, box_y + box_h * 3 // 4 - 2, zhi, font_ganzhi_big, get_zhi_color(zhi))

    # 藏干
    y_base = table_y + row_header_h + row_zhuXing_h + row_ganzhi_h + 8
    for j, cg in enumerate(data['hideGan'][p]):
        draw_center_text(cx, y_base + j * 22, cg, font_small, get_gan_color(cg))

    # 副星
    y_base = table_y + row_header_h + row_zhuXing_h + row_ganzhi_h + row_canggan_h + 8
    for j, fx in enumerate(data['shiShenZhi'][p]):
        draw_center_text(cx, y_base + j * 22, fx, font_small, TEXT_DIM)

    # 纳音
    y = table_y + row_header_h + row_zhuXing_h + row_ganzhi_h + row_canggan_h + row_fuxing_h + row_nayin_h // 2
    draw_center_text(cx, y, data['naYin'][p], font_small, TEXT_DIM)

    # 星运
    y = table_y + row_header_h + row_zhuXing_h + row_ganzhi_h + row_canggan_h + row_fuxing_h + row_nayin_h + row_xingyun_h // 2
    draw_center_text(cx, y, xing_yun[i], font_small, TEXT_DIM)

    # 自坐
    y = table_y + row_header_h + row_zhuXing_h + row_ganzhi_h + row_canggan_h + row_fuxing_h + row_nayin_h + row_xingyun_h + row_zizuo_h // 2
    draw_center_text(cx, y, zi_zuo[i], font_small, TEXT_DIM)

    # 空亡
    y = table_y + row_header_h + row_zhuXing_h + row_ganzhi_h + row_canggan_h + row_fuxing_h + row_nayin_h + row_xingyun_h + row_zizuo_h + row_xunkong_h // 2
    draw_center_text(cx, y, data['xunKong'][p], font_small, TEXT_DIM)

    # 神煞（分两列显示）
    y_base = table_y + row_header_h + row_zhuXing_h + row_ganzhi_h + row_canggan_h + row_fuxing_h + row_nayin_h + row_xingyun_h + row_zizuo_h + row_xunkong_h + 10
    ss_list = data['shenSha'][p]
    for idx, ss in enumerate(ss_list[:10]):
        row = idx // 2
        col = idx % 2
        sx = table_x + i * col_w + 10 + col * (col_w // 2 - 2)
        sy = y_base + row * 20
        color = SHEN_SHA_COLORS.get(ss['luck'], TEXT_DIM)
        draw.text((sx, sy), ss['name'], font=font_tiny, fill=color)

# ============================================================
# 8. 胎元/命宫/身宫
# ============================================================
ey = table_y + table_h + 20
ex = margin
card_w = (W - 2*margin - 2*14) // 3

for i, (label, key) in enumerate([("胎元", "taiYuan"), ("命宫", "mingGong"), ("身宫", "shenGong")]):
    x = ex + i * (card_w + 14)
    draw_rounded_rect(x, ey, card_w, 55, 8, CARD_BG, CARD_BORDER, 1)
    draw.text((x+14, ey+8), label, font=font_small, fill=TEXT_GOLD)
    draw.text((x+14, ey+28), data['extra'][key]['ganZhi'], font=font_small, fill=TEXT_DARK)

# ============================================================
# 9. 大运 + 流年 + 流月
# ============================================================
dy_start = ey + 75
dy_h = 650

draw_rounded_rect(margin, dy_start, W - 2*margin, dy_h, 10, CARD_BG, CARD_BORDER, 2)
direction = "顺排" if data["yun"]["isForward"] else "逆排"
draw.text((margin + 15, dy_start + 8), f"大运（{direction}）  起运：{data['yun']['startAge']}  {data['yun']['startSolarDate']}", font=font_small, fill=TEXT_GOLD)

da_yuns = data["yun"]["daYun"]
current_index = 2

daw_x = margin + 12
daw_y = dy_start + 35
daw_w = 110
daw_h = 85
daw_gap = 6

for i, dy in enumerate(da_yuns):
    x = daw_x + i * (daw_w + daw_gap)
    is_current = (i == current_index)
    bg = "#e8dfd1" if is_current else "#f5efe6"
    border = "#8b6914" if is_current else CARD_BORDER
    draw_rounded_rect(x, daw_y, daw_w, daw_h, 6, bg, border, 2)
    draw_center_text(x + daw_w//2, daw_y + 10, f"{dy['startYear']}-{dy['endYear']}", font_tiny, TEXT_DIM)
    draw_center_text(x + daw_w//2, daw_y + 24, f"{dy['startAge']}岁", font_tiny, TEXT_DIM)
    gz = dy['ganZhi']
    draw_center_text(x + daw_w//2, daw_y + 48, gz[0], font_mid, get_gan_color(gz[0]))
    draw_center_text(x + daw_w//2, daw_y + 68, gz[1], font_mid, get_zhi_color(gz[1]))
    if is_current:
        draw_center_text(x + daw_w//2, daw_y + daw_h - 5, "▼ 当前", font_tiny, "#c62828")

selected_da_yun = da_yuns[current_index]
ln_y = daw_y + daw_h + 18
draw.text((margin + 15, ln_y), f"流年（{selected_da_yun['ganZhi']}大运 {selected_da_yun['startYear']}-{selected_da_yun['endYear']}）", font=font_small, fill=TEXT_GOLD)

ln_start_y = ln_y + 25
ln_card_w = 90
ln_card_h = 55
ln_gap = 5
ln_per_row = 14

for i, ln in enumerate(selected_da_yun['liuNian']):
    r = i // ln_per_row
    c = i % ln_per_row
    x = margin + 12 + c * (ln_card_w + ln_gap)
    y = ln_start_y + r * (ln_card_h + ln_gap)
    is_current_year = (ln['year'] == 2026)
    bg = "#e8dfd1" if is_current_year else "#f5efe6"
    border = "#8b6914" if is_current_year else CARD_BORDER
    draw_rounded_rect(x, y, ln_card_w, ln_card_h, 4, bg, border, 1)
    draw_center_text(x + ln_card_w//2, y + 8, str(ln['year']), font_tiny, TEXT_DIM)
    gz = ln['ganZhi']
    draw_center_text(x + ln_card_w//2, y + 26, gz[0], font_small, get_gan_color(gz[0]))
    draw_center_text(x + ln_card_w//2, y + 42, gz[1], font_small, get_zhi_color(gz[1]))

selected_liu_nian = selected_da_yun['liuNian'][3]
ly_y = ln_start_y + ((len(selected_da_yun['liuNian']) - 1) // ln_per_row + 1) * (ln_card_h + ln_gap) + 18
draw.text((margin + 15, ly_y), f"流月（{selected_liu_nian['ganZhi']}流年 {selected_liu_nian['year']}年）", font=font_small, fill=TEXT_GOLD)

ly_start_y = ly_y + 25
ly_card_w = 75
ly_card_h = 45
ly_gap = 5
ly_per_row = 12

for i, ly in enumerate(selected_liu_nian['liuYue']):
    c = i % ly_per_row
    x = margin + 12 + c * (ly_card_w + ly_gap)
    y = ly_start_y
    draw_rounded_rect(x, y, ly_card_w, ly_card_h, 3, "#f5efe6", CARD_BORDER, 1)
    draw_center_text(x + ly_card_w//2, y + 6, ly['month'], font_tiny, TEXT_DIM)
    gz = ly['ganZhi']
    draw_center_text(x + ly_card_w//2, y + 24, gz[0], font_tiny, get_gan_color(gz[0]))
    draw_center_text(x + ly_card_w//2, y + 36, gz[1], font_tiny, get_zhi_color(gz[1]))

# ============================================================
# 10. 保存
# ============================================================
out = "C:/Users/Administrator/WorkBuddy/2026-05-14-task-11/bazi-paipan-v6.png"
img.save(out, quality=95)
print(f"Saved to {out}")
