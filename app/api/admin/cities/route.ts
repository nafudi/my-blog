import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import auth from "@/lib/auth-server";

const prisma = new PrismaClient();

// 默认省市经度数据
const DEFAULT_CITIES = [
  { province: "北京市", city: "北京", longitude: 116.4 },
  { province: "天津市", city: "天津", longitude: 117.2 },
  { province: "河北省", city: "石家庄", longitude: 114.48 },
  { province: "河北省", city: "唐山", longitude: 118.02 },
  { province: "河北省", city: "秦皇岛", longitude: 119.6 },
  { province: "河北省", city: "保定", longitude: 115.46 },
  { province: "河北省", city: "沧州", longitude: 116.83 },
  { province: "山西省", city: "太原", longitude: 112.53 },
  { province: "山西省", city: "大同", longitude: 113.29 },
  { province: "山西省", city: "运城", longitude: 111.0 },
  { province: "内蒙古自治区", city: "呼和浩特", longitude: 111.65 },
  { province: "内蒙古自治区", city: "包头", longitude: 109.82 },
  { province: "内蒙古自治区", city: "鄂尔多斯", longitude: 109.77 },
  { province: "内蒙古自治区", city: "赤峰", longitude: 118.89 },
  { province: "辽宁省", city: "沈阳", longitude: 123.43 },
  { province: "辽宁省", city: "大连", longitude: 121.62 },
  { province: "辽宁省", city: "鞍山", longitude: 122.99 },
  { province: "辽宁省", city: "锦州", longitude: 121.13 },
  { province: "吉林省", city: "长春", longitude: 125.32 },
  { province: "吉林省", city: "吉林", longitude: 126.55 },
  { province: "吉林省", city: "延吉", longitude: 129.51 },
  { province: "黑龙江省", city: "哈尔滨", longitude: 126.53 },
  { province: "黑龙江省", city: "齐齐哈尔", longitude: 123.93 },
  { province: "黑龙江省", city: "大庆", longitude: 125.03 },
  { province: "黑龙江省", city: "牡丹江", longitude: 129.62 },
  { province: "上海市", city: "上海", longitude: 121.47 },
  { province: "江苏省", city: "南京", longitude: 118.78 },
  { province: "江苏省", city: "苏州", longitude: 120.62 },
  { province: "江苏省", city: "无锡", longitude: 120.29 },
  { province: "江苏省", city: "常州", longitude: 119.97 },
  { province: "江苏省", city: "徐州", longitude: 117.18 },
  { province: "江苏省", city: "南通", longitude: 120.86 },
  { province: "江苏省", city: "扬州", longitude: 119.42 },
  { province: "江苏省", city: "连云港", longitude: 119.16 },
  { province: "浙江省", city: "杭州", longitude: 120.19 },
  { province: "浙江省", city: "宁波", longitude: 121.55 },
  { province: "浙江省", city: "温州", longitude: 120.7 },
  { province: "浙江省", city: "嘉兴", longitude: 120.76 },
  { province: "浙江省", city: "绍兴", longitude: 120.58 },
  { province: "浙江省", city: "金华", longitude: 119.65 },
  { province: "浙江省", city: "台州", longitude: 121.42 },
  { province: "安徽省", city: "合肥", longitude: 117.28 },
  { province: "安徽省", city: "蚌埠", longitude: 117.38 },
  { province: "安徽省", city: "芜湖", longitude: 118.37 },
  { province: "安徽省", city: "安庆", longitude: 117.06 },
  { province: "福建省", city: "福州", longitude: 119.3 },
  { province: "福建省", city: "厦门", longitude: 118.09 },
  { province: "福建省", city: "泉州", longitude: 118.58 },
  { province: "福建省", city: "漳州", longitude: 117.65 },
  { province: "江西省", city: "南昌", longitude: 115.89 },
  { province: "江西省", city: "赣州", longitude: 114.93 },
  { province: "江西省", city: "九江", longitude: 116.0 },
  { province: "山东省", city: "济南", longitude: 116.98 },
  { province: "山东省", city: "青岛", longitude: 120.38 },
  { province: "山东省", city: "烟台", longitude: 121.39 },
  { province: "山东省", city: "威海", longitude: 122.12 },
  { province: "山东省", city: "潍坊", longitude: 119.16 },
  { province: "山东省", city: "淄博", longitude: 118.05 },
  { province: "山东省", city: "临沂", longitude: 118.35 },
  { province: "山东省", city: "济宁", longitude: 116.59 },
  { province: "山东省", city: "泰安", longitude: 117.09 },
  { province: "河南省", city: "郑州", longitude: 113.65 },
  { province: "河南省", city: "洛阳", longitude: 112.45 },
  { province: "河南省", city: "开封", longitude: 114.35 },
  { province: "河南省", city: "南阳", longitude: 112.53 },
  { province: "河南省", city: "新乡", longitude: 113.92 },
  { province: "湖北省", city: "武汉", longitude: 114.29 },
  { province: "湖北省", city: "宜昌", longitude: 111.28 },
  { province: "湖北省", city: "襄阳", longitude: 112.12 },
  { province: "湖北省", city: "荆州", longitude: 112.24 },
  { province: "湖南省", city: "长沙", longitude: 112.93 },
  { province: "湖南省", city: "株洲", longitude: 113.14 },
  { province: "湖南省", city: "衡阳", longitude: 112.57 },
  { province: "湖南省", city: "岳阳", longitude: 113.13 },
  { province: "湖南省", city: "张家界", longitude: 110.48 },
  { province: "广东省", city: "广州", longitude: 113.26 },
  { province: "广东省", city: "深圳", longitude: 114.06 },
  { province: "广东省", city: "珠海", longitude: 113.58 },
  { province: "广东省", city: "东莞", longitude: 113.75 },
  { province: "广东省", city: "佛山", longitude: 113.12 },
  { province: "广东省", city: "中山", longitude: 113.38 },
  { province: "广东省", city: "惠州", longitude: 114.41 },
  { province: "广东省", city: "汕头", longitude: 116.68 },
  { province: "广东省", city: "湛江", longitude: 110.36 },
  { province: "广西壮族自治区", city: "南宁", longitude: 108.31 },
  { province: "广西壮族自治区", city: "桂林", longitude: 110.28 },
  { province: "广西壮族自治区", city: "柳州", longitude: 109.4 },
  { province: "广西壮族自治区", city: "北海", longitude: 109.11 },
  { province: "海南省", city: "海口", longitude: 110.35 },
  { province: "海南省", city: "三亚", longitude: 109.51 },
  { province: "重庆市", city: "重庆", longitude: 106.55 },
  { province: "四川省", city: "成都", longitude: 104.06 },
  { province: "四川省", city: "绵阳", longitude: 104.68 },
  { province: "四川省", city: "宜宾", longitude: 104.64 },
  { province: "四川省", city: "泸州", longitude: 105.44 },
  { province: "四川省", city: "南充", longitude: 106.11 },
  { province: "四川省", city: "乐山", longitude: 103.77 },
  { province: "贵州省", city: "贵阳", longitude: 106.71 },
  { province: "贵州省", city: "遵义", longitude: 106.91 },
  { province: "贵州省", city: "毕节", longitude: 105.29 },
  { province: "云南省", city: "昆明", longitude: 102.71 },
  { province: "云南省", city: "大理", longitude: 100.27 },
  { province: "云南省", city: "丽江", longitude: 100.23 },
  { province: "云南省", city: "曲靖", longitude: 103.8 },
  { province: "西藏自治区", city: "拉萨", longitude: 91.11 },
  { province: "陕西省", city: "西安", longitude: 108.94 },
  { province: "陕西省", city: "宝鸡", longitude: 107.24 },
  { province: "陕西省", city: "延安", longitude: 109.49 },
  { province: "陕西省", city: "榆林", longitude: 109.74 },
  { province: "甘肃省", city: "兰州", longitude: 103.82 },
  { province: "甘肃省", city: "天水", longitude: 105.72 },
  { province: "甘肃省", city: "酒泉", longitude: 98.51 },
  { province: "甘肃省", city: "敦煌", longitude: 94.66 },
  { province: "甘肃省", city: "张掖", longitude: 100.45 },
  { province: "甘肃省", city: "嘉峪关", longitude: 98.29 },
  { province: "青海省", city: "西宁", longitude: 101.77 },
  { province: "青海省", city: "格尔木", longitude: 94.91 },
  { province: "宁夏回族自治区", city: "银川", longitude: 106.27 },
  { province: "宁夏回族自治区", city: "吴忠", longitude: 106.2 },
  { province: "宁夏回族自治区", city: "中卫", longitude: 105.19 },
  { province: "新疆维吾尔自治区", city: "乌鲁木齐", longitude: 87.61 },
  { province: "新疆维吾尔自治区", city: "克拉玛依", longitude: 84.87 },
  { province: "新疆维吾尔自治区", city: "喀什", longitude: 75.99 },
  { province: "新疆维吾尔自治区", city: "伊犁", longitude: 81.32 },
  { province: "新疆维吾尔自治区", city: "吐鲁番", longitude: 89.19 },
  { province: "香港特别行政区", city: "香港", longitude: 114.17 },
  { province: "澳门特别行政区", city: "澳门", longitude: 113.55 },
  { province: "台湾省", city: "台北", longitude: 121.56 },
  { province: "台湾省", city: "高雄", longitude: 120.3 },
  { province: "台湾省", city: "台中", longitude: 120.67 },
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = ["841428951@qq.com"];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cities = await prisma.city.findMany({
    orderBy: [{ province: "asc" }, { city: "asc" }],
  });
  return NextResponse.json(cities);
}

// 初始化/批量添加城市数据
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = ["841428951@qq.com"];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action } = body;

  if (action === "init") {
    // 批量初始化所有城市数据
    const result = await prisma.city.createMany({
      data: DEFAULT_CITIES.map((c) => ({
        province: c.province,
        city: c.city,
        longitude: c.longitude,
        timezone: "Asia/Shanghai",
      })),
      skipDuplicates: true, // 跳过已存在的
    });
    return NextResponse.json({ ok: true, count: result.count });
  }

  if (action === "add") {
    // 添加单条
    const { province, city, longitude } = body;
    if (!province || !city || longitude === undefined) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }
    const result = await prisma.city.create({
      data: { province, city, longitude, timezone: "Asia/Shanghai" },
    });
    return NextResponse.json({ ok: true, city: result });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}

// 删除城市
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = ["841428951@qq.com"];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.city.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
