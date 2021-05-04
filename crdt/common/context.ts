import "./extend";
import {Clock, Dot, DotStr, dotToString, mergeClock, Replica, str2dot, Time} from "./common";
import { merge } from "./mergeable";

export class Context {

    constructor(private readonly  clock: Clock, private readonly cloud: ReadonlySet<DotStr>) {
    }


    contains(dot: Dot) {
        return this.clock.has(dot.Replica)
            && this.clock.get(dot.Replica) >= dot.Time
            || this.cloud.has(dotToString(dot));
    }

    nextDot(replica: Replica): { dot: Dot, context: Context } {
        const clock = (this.clock.has(replica))
            ? this.clock.with([replica, this.clock.get(replica) + 1])
            : this.clock.with([replica, 1]);
        return {
            dot: {Replica: replica, Time: clock.get(replica)},
            context: new Context(clock, this.cloud)
        };
    }

    with(dot: DotStr) {
        return new Context(this.clock, this.cloud.with(dot));
    }

    compact() {
        let clock = this.clock;
        let cloud = this.cloud;
        [...this.cloud]
            .map(str2dot)
            .orderBy(a => a.Time)
            .forEach((dot) => {
                let clockTime = this.clock.get(dot.Replica) ?? 0;
                if (dot.Time <= clockTime + 1) {
                    clockTime = dot.Time;
                    cloud = cloud.without(dotToString(dot));
                    clock = clock.with([dot.Replica, clockTime]);
                }
            })
        return new Context(clock, cloud);
    }

    static merge(a: Context, b: Context) {
        return new Context(
            mergeClock(a.clock, b.clock),
            new Set([...a.cloud, ...b.cloud])
        );
    }

    static get Zero() {
        return new Context(new Map<Replica, Time>(), new Set<DotStr>());
    }

    public getReplicas() {
        return [...this.clock.keys()].orderBy(x => x);
    }

    public toString(replica?) {
        if (replica) {
            const cloud = [...this.cloud].map(str2dot).filter(x => x.Replica == replica).map(x => x.Time).join(',');
            return `${replica}:${this.clock.get(replica)} | ${cloud} ${new Array(10 - cloud.length).fill('_').join('')}|`;
        }
        return this.getReplicas().map(replica => this.toString(replica)).join('\n');
    }
}
