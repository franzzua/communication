export type Replica = string;
export type Time = number;
export type Dot = { Replica: Replica; Time: Time; }
export type DotStr = string;
export const dotEqual = (a: Dot, b: Dot) => a.Replica == b.Replica && a.Time == b.Time;
export const dotToString = (a: Dot) => `${a.Replica}:${a.Time}` as DotStr;
export const str2dot = (a: DotStr) => {
    const [replica, time] = a.split(':');
    return {Replica: replica, Time: +time} as Dot;
}
export type Clock = ReadonlyMap<Replica, Time>;
export const mergeClock = (a: Clock, b: Clock) => new Map<Replica, Time>([...new Set([...a.keys(), ...b.keys()])]
    .map(key => [key, Math.max(a.get(key) ?? 0, b.get(key) ?? 0)])) as Clock;
