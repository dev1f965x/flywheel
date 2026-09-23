import type { Repeat } from "./tasks";

export const APP_NAME = "flywheel";

export const TASK_LABELS = {
  heading: "오늘 할 일",
  add: "할 일 적기",
  addPlaceholder: "무엇을 하나요",
  finish: (name: string) => `${name} 끝내기`,
  unfinish: (name: string) => `${name} 다시 열기`,
  remove: (name: string) => `${name} 지우기`,
  start: "시작",
  stop: "멈춤",
  running: "하는 중",
  empty: "오늘 할 일이 없어요",
  emptyDetail: "아래에 적으면 바로 시작할 수 있어요",
  firstRun: "무엇부터 할까요",
  done: "끝낸 일",
  /** Said from the second day: one day in a row is just today. */
  streak: (days: number) => `${days}일 연속`,
  spent: (span: string) => `오늘 ${span}`,
  spentBriefly: "오늘 1분 미만",
  late: (days: number) => (days === 1 ? "어제 것이에요" : `${days}일 밀렸어요`),
  rename: "이름 바꾸기",
  changeRepeat: "반복 바꾸기",
  removed: (name: string) => `"${name}"을 지웠어요`,
  undo: "되돌리기",
};

export const REPEAT_LABELS = {
  heading: "반복",
  none: "한 번만",
  day: "매일",
  weekdays: "요일마다",
  days: "N일마다",
  everyDays: (count: number) => `${count}일마다`,
  weekdayNames: ["일", "월", "화", "수", "목", "금", "토"],
  next: (day: string) => `다음 ${day}`,
  tomorrow: "내일 또",
  onWeekday: (weekday: string) => `다음 ${weekday}요일`,
  inDays: (days: number) => `${days}일 뒤에 또`,
  ask: "무슨 요일에요?",
};

export const TODAY_LABELS = {
  heading: "오늘",
  doing: (name: string) => `하는 중 · ${name}`,
  idle: "멈춰 있어요",
};

export const DISCORD_LABELS = {
  heading: "디스코드",
  show: "하는 일 보여주기",
  connected: "디스코드에 연결됐어요",
  waiting: "디스코드를 기다리는 중",
  waitingDetail: "디스코드를 켜면 바로 연결돼요",
  off: "꺼져 있어요",
  appId: "디스코드 앱 ID",
  appIdPlaceholder: "Application ID",
  appIdHint:
    "디스코드 개발자 포털에서 앱을 하나 만들면 나오는 번호예요. 그 앱 이름으로 상태가 떠요",
  unavailable: "이 화면에서는 디스코드를 쓸 수 없어요",
  unavailableDetail: "윈도우 앱에서만 돼요. 디스코드가 같은 PC에서 돌아야 하거든요",
};

export function describeRepeat(repeat: Repeat | undefined): string {
  if (!repeat) return REPEAT_LABELS.none;
  if (repeat.every === "day") return REPEAT_LABELS.day;
  if (repeat.every === "days") return REPEAT_LABELS.everyDays(repeat.count);

  const names = [...repeat.on].sort().map((weekday) => REPEAT_LABELS.weekdayNames[weekday]);
  return names.length === 0 ? REPEAT_LABELS.none : `${names.join("·")}요일`;
}
