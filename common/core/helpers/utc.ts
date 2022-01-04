import { DateTime, Duration} from 'luxon';
export {DateTime, Duration};

export function utc();
export function utc(millis: number);
export function utc(iso: string);
export function utc(input?: string | number) {
    if (input === undefined) {
        return DateTime.utc();
    }
    if (typeof input === "string") {
        return DateTime.fromISO(input);
    }
    if (typeof input === "number") {
        return DateTime.fromMillis(input);

    }
}
