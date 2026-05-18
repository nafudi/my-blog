declare module 'chinese-lunar-calendar' {
  export function lunar2Solar(
    lunarYear: number,
    lunarMonth: number,
    lunarDay: number,
    isLeapMonth: boolean
  ): { year: number; month: number; day: number };
}
