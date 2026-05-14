from typing import Dict, List, Optional, Tuple, Union
from lunar_python import Solar, EightChar

class ShenShaFull:
    """完整神煞计算器（基于 lunar-python）"""

    # 以日干查的神煞映射表
    SHENSHA_BY_DAY_GAN = {
        '天乙贵人': {'甲': '丑/未', '乙': '子/申', '丙': '亥/酉', '丁': '亥/酉',
                    '戊': '丑/未', '己': '子/申', '庚': '丑/未', '辛': '寅/午',
                    '壬': '卯/巳', '癸': '卯/巳'},
        '文昌贵人': {'甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
                    '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
                    '壬': '寅', '癸': '卯'},
        '禄神': {'甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
                  '戊': '巳', '己': '午', '庚': '申', '辛': '酉',
                  '壬': '亥', '癸': '子'},
        '羊刃': {'甲': '卯', '乙': '寅', '丙': '午', '丁': '巳',
                  '戊': '午', '己': '巳', '庚': '酉', '辛': '申',
                  '壬': '子', '癸': '亥'},
        '金舆': {'甲': '辰', '乙': '巳', '丙': '未', '丁': '申',
                  '戊': '未', '己': '申', '庚': '戌', '辛': '亥',
                  '壬': '丑', '癸': '寅'},
        '太极贵人': {'甲': '子/午', '乙': '子/午', '丙': '卯/酉', '丁': '卯/酉',
                    '戊': '辰/戌/丑/未', '己': '辰/戌/丑/未',
                    '庚': '寅/亥', '辛': '寅/亥', '壬': '申/巳', '癸': '申/巳'},
        '福星贵人': {'甲': '寅', '乙': '亥', '丙': '戌', '丁': '酉',
                    '戊': '申', '己': '未', '庚': '午', '辛': '巳',
                    '壬': '辰', '癸': '卯'},
        '天厨贵人': {'甲': '巳', '乙': '午', '丙': '午', '丁': '巳',
                    '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
                    '壬': '寅', '癸': '卯'},
        '天官贵人': {'甲': '未', '乙': '辰', '丙': '巳', '丁': '寅',
                    '戊': '卯', '己': '酉', '庚': '亥', '辛': '酉',
                    '壬': '戌', '癸': '午'},
        '国印贵人': {'甲': '戌', '乙': '亥', '丙': '丑', '丁': '寅',
                    '戊': '丑', '己': '寅', '庚': '辰', '辛': '巳',
                    '壬': '未', '癸': '申'},
        '红艳煞': {'甲': '午', '乙': '申', '丙': '寅', '丁': '未',
                  '戊': '辰', '己': '辰', '庚': '戌', '辛': '酉',
                  '壬': '子', '癸': '申'},
        '流霞': {'甲': '酉', '乙': '戌', '丙': '未', '丁': '申',
                '戊': '巳', '己': '午', '庚': '辰', '辛': '卯',
                '壬': '亥', '癸': '寅'},
        '十恶大败': {'甲': '辰', '乙': '巳', '丙': '申', '丁': '亥',
                    '戊': '戌', '己': '丑', '庚': '辰', '辛': '巳',
                    '壬': '申', '癸': '亥'},
        '自缢': {'甲': '戌', '乙': '巳', '丙': '午', '丁': '未',
                '戊': '申', '己': '酉', '庚': '寅', '辛': '卯',
                '壬': '辰', '癸': '亥'},
        '水厄': {'甲': '戌', '乙': '未', '丙': '未', '丁': '未',
                '戊': '未', '己': '未', '庚': '未', '辛': '未',
                '壬': '未', '癸': '戌'},
    }

    # 三合局神煞
    SAN_HE_MAP = {
        '申子辰': {'驿马': '寅', '华盖': '辰', '将星': '子', '桃花': '酉',
                    '劫煞': '巳', '灾煞': '午', '六厄': '卯', '亡神': '亥'},
        '寅午戌': {'驿马': '申', '华盖': '戌', '将星': '午', '桃花': '卯',
                    '劫煞': '亥', '灾煞': '子', '六厄': '酉', '亡神': '巳'},
        '巳酉丑': {'驿马': '亥', '华盖': '丑', '将星': '酉', '桃花': '午',
                    '劫煞': '寅', '灾煞': '卯', '六厄': '子', '亡神': '申'},
        '亥卯未': {'驿马': '巳', '华盖': '未', '将星': '卯', '桃花': '子',
                    '劫煞': '申', '灾煞': '酉', '六厄': '午', '亡神': '寅'},
    }

    # 孤辰寡宿（三会局规则）
    GU_GU_MAP = {
        '亥子丑': {'孤辰': '寅', '寡宿': '戌'},
        '寅卯辰': {'孤辰': '巳', '寡宿': '丑'},
        '巳午未': {'孤辰': '申', '寡宿': '辰'},
        '申酉戌': {'孤辰': '亥', '寡宿': '未'},
    }

    # 红鸾天喜（年支查）
    HONG_LUAN = {
        '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌',
        '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰'
    }
    TIAN_XI = {
        '子': '酉', '丑': '申', '寅': '未', '卯': '午',
        '辰': '巳', '巳': '辰', '午': '卯', '未': '寅',
        '申': '丑', '酉': '子', '戌': '亥', '亥': '戌',
    }

    # 元辰规则（男女性别区分）
    YUAN_CHEN_MALE = {
        '子': '未', '丑': '申', '寅': '酉', '卯': '戌', '辰': '亥', '巳': '子',
        '午': '丑', '未': '寅', '申': '卯', '酉': '辰', '戌': '巳', '亥': '午'
    }
    YUAN_CHEN_FEMALE = {
        '子': '巳', '丑': '午', '寅': '未', '卯': '申', '辰': '酉', '巳': '戌',
        '午': '亥', '未': '子', '申': '丑', '酉': '寅', '戌': '卯', '亥': '辰'
    }

    def __init__(self):
        pass

    @staticmethod
    def get_na_yin_wu_xing(na_yin: str) -> str:
        """根据纳音字符串返回五行"""
        jin = ['海中金', '剑锋金', '白腊金', '沙中金', '金箔金', '钗钏金']
        mu = ['大林木', '杨柳木', '松柏木', '平地木', '桑柘木', '石榴木']
        shui = ['涧下水', '大溪水', '长流水', '天河水', '泉中水', '大海水']
        huo = ['霹雳火', '炉中火', '山下火', '山头火', '覆灯火', '天上火']
        tu = ['城墙土', '路旁土', '屋上土', '壁上土', '大驿土', '沙中土']
        if na_yin in jin: return '金'
        if na_yin in mu: return '木'
        if na_yin in shui: return '水'
        if na_yin in huo: return '火'
        if na_yin in tu: return '土'
        return '土'

    def get_gou_jiao(self, year_zhi: str, is_male: bool, is_yang: bool) -> List[Tuple[str, str]]:
        """获取勾绞煞"""
        zhi_order = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
        if year_zhi not in zhi_order:
            return []
        idx = zhi_order.index(year_zhi)
        if (is_male and is_yang) or (not is_male and not is_yang):
            gou_idx = (idx + 3) % 12
            jiao_idx = (idx - 3) % 12
        else:
            gou_idx = (idx - 3) % 12
            jiao_idx = (idx + 3) % 12
        return [('勾神', zhi_order[gou_idx]), ('绞神', zhi_order[jiao_idx])]

    @staticmethod
    def get_four_waste(season: str, day_gan_zhi: str) -> bool:
        season_map = {
            '春': ['庚申', '辛酉'],
            '夏': ['壬子', '癸亥'],
            '秋': ['甲寅', '乙卯'],
            '冬': ['丙午', '丁巳']
        }
        return day_gan_zhi in season_map.get(season, [])

    @staticmethod
    def get_tian_she(season: str, day_gan_zhi: str) -> bool:
        season_map = {'春': '戊寅', '夏': '甲午', '秋': '戊申', '冬': '甲子'}
        return day_gan_zhi == season_map.get(season, '')

    @staticmethod
    def check_tongzi(season: str, na_yin: str, day_zhi: str, time_zhi: str) -> bool:
        """判断童子煞"""
        if season in ['春', '秋']:
            if day_zhi in ['寅', '子'] or time_zhi in ['寅', '子']:
                return True
        elif season in ['夏', '冬']:
            if day_zhi in ['卯', '未', '辰'] or time_zhi in ['卯', '未', '辰']:
                return True
        wu_xing = ShenShaFull.get_na_yin_wu_xing(na_yin) if na_yin else ''
        if wu_xing in ['金', '木']:
            if day_zhi in ['午', '卯'] or time_zhi in ['午', '卯']:
                return True
        elif wu_xing in ['水', '火']:
            if day_zhi in ['酉', '戌'] or time_zhi in ['酉', '戌']:
                return True
        elif wu_xing == '土':
            if day_zhi in ['辰', '巳'] or time_zhi in ['辰', '巳']:
                return True
        return False

    def get_full_shensha(self, bazi: EightChar, is_male: bool = True,
                         solar_date=None) -> Dict[str, Union[str, List[str]]]:
        """获取完整神煞信息"""
        year_gan = bazi.getYear()[0]
        year_zhi = bazi.getYear()[1:]
        month_zhi = bazi.getMonth()[1:]
        day_gan = bazi.getDay()[0]
        day_zhi = bazi.getDay()[1:]
        time_zhi = bazi.getTime()[1:] if bazi.getTime() else ''
        day_gan_zhi = bazi.getDay()

        yang_gan_list = ['甲', '丙', '戊', '庚', '壬']
        is_yang = day_gan in yang_gan_list

        # 季节
        season = ''
        if solar_date:
            month = solar_date.getMonth()
            if 3 <= month <= 5: season = '春'
            elif 6 <= month <= 8: season = '夏'
            elif 9 <= month <= 11: season = '秋'
            else: season = '冬'

        na_yin = bazi.getDayNaYin()

        results = {}

        # 1. 以日干查的神煞
        for name, mapping in self.SHENSHA_BY_DAY_GAN.items():
            if day_gan in mapping:
                results[name] = mapping[day_gan]

        # 2. 以日支/年支三合局查的神煞
        for group, shensha_map in self.SAN_HE_MAP.items():
            if day_zhi in group or year_zhi in group:
                for sha_name, target in shensha_map.items():
                    if sha_name not in results:
                        results[sha_name] = target

        # 3. 孤辰寡宿
        for group, shensha_map in self.GU_GU_MAP.items():
            if year_zhi in group:
                for sha_name, target in shensha_map.items():
                    results[sha_name] = target

        # 4. 红鸾天喜
        if year_zhi in self.HONG_LUAN:
            results['红鸾'] = self.HONG_LUAN[year_zhi]
        if year_zhi in self.TIAN_XI:
            results['天喜'] = self.TIAN_XI[year_zhi]

        # 5. 元辰（区分性别）
        if is_male:
            if year_zhi in self.YUAN_CHEN_MALE:
                results['元辰'] = self.YUAN_CHEN_MALE[year_zhi]
        else:
            if year_zhi in self.YUAN_CHEN_FEMALE:
                results['元辰'] = self.YUAN_CHEN_FEMALE[year_zhi]

        # 6. 勾绞煞
        gou_jiao = self.get_gou_jiao(year_zhi, is_male, is_yang)
        for sha_name, target in gou_jiao:
            results[sha_name] = target

        # 7. 魁罡
        if day_gan_zhi in ['壬辰', '庚戌', '庚辰', '戊戌']:
            results['魁罡'] = '是'

        # 8. 金神
        if day_gan_zhi in ['乙丑', '己巳', '癸酉']:
            results['金神'] = '是'

        # 9. 天赦
        if season and self.get_tian_she(season, day_gan_zhi):
            results['天赦'] = '是'

        # 10. 四废
        if season and self.get_four_waste(season, day_gan_zhi):
            results['四废'] = '是'

        # 11. 童子煞
        if season and self.check_tongzi(season, na_yin, day_zhi, time_zhi):
            results['童子煞'] = '是'

        # 12. 天医（月后退一辰）
        month_zhi_idx = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
        if month_zhi in month_zhi_idx:
            idx = month_zhi_idx.index(month_zhi)
            results['天医'] = month_zhi_idx[(idx - 1) % 12]

        # 13. 天月二德
        tian_de_map = {'寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '亥',
                       '未': '甲', '申': '癸', '酉': '寅', '戌': '丙', '亥': '乙',
                       '子': '巳', '丑': '庚'}
        yue_de_map = {'寅': '丙', '卯': '甲', '辰': '壬', '巳': '庚', '午': '丙',
                      '未': '甲', '申': '壬', '酉': '庚', '戌': '丙', '亥': '甲',
                      '子': '壬', '丑': '庚'}
        if month_zhi in tian_de_map:
            results['天德'] = tian_de_map[month_zhi]
            results['月德'] = yue_de_map[month_zhi]

        return results


# 独立函数：供 gen_bazi_img_v5.py 调用
def calc_shensha(year, month, day, hour, gender):
    """
    计算神煞，返回 dict: { pillar_name: [{'name': ..., 'luck': ...}, ...] }
    gender: 1=男, 0=女
    """
    solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
    lunar = solar.getLunar()
    bazi = lunar.getEightChar()
    calc = ShenShaFull()
    is_male = (gender == 1)
    raw = calc.get_full_shensha(bazi, is_male=is_male, solar_date=solar)

    # 将结果按柱分配（简化：全部挂到日柱；或按各柱地支匹配）
    # 这里返回完整 dict，由调用方决定如何分配到各柱
    return raw


if __name__ == '__main__':
    solar = Solar.fromYmdHms(1998, 1, 22, 4, 0, 0)
    lunar = solar.getLunar()
    bazi = lunar.getEightChar()
    print(f"八字: {bazi.getYear()} {bazi.getMonth()} {bazi.getDay()} {bazi.getTime()}")

    calc = ShenShaFull()
    shensha = calc.get_full_shensha(bazi, is_male=True, solar_date=solar)
    print("神煞:")
    for name, value in shensha.items():
        print(f"  {name}: {value}")
