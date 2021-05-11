import "./extend";
import {ConstructorOf, IMergeable} from "./mergeable";
import {Context} from "./context";
import {DotStr, dotToString, Replica, str2dot} from "./common";


export class Kernel<TEntry> extends IMergeable {

    protected new = this.constructor as  ConstructorOf<this, typeof Kernel>;
    constructor(public readonly context: Context, public readonly entries: ReadonlyMap<DotStr, TEntry>) {
        super();
    }

    static Zero<TEntry>() {
        return new Kernel(Context.Zero, new Map<DotStr, TEntry>());
    }

    public merge(b: this): this {
        if (!b) return this;
        const addEntries = [...b.entries].filter(([key]) => !this.entries.has(key) && !this.context.contains(str2dot(key)));
        const remKeys = [...this.entries.keys()].filter(key => !b.entries.has(key) && b.context.contains(str2dot(key)));
        const entries = this.entries
            .with(...addEntries)
            .without(...remKeys);

        const context = Context.merge(this.context, b.context);
        return new this.new(context, entries);
    }

    get values() {
        return new Set(this.entries.values());
    }

    public withContext(context: Context) {
        return new Kernel(context, this.entries);
    }

    public withEntries(entries: ReadonlyMap<DotStr, TEntry>) {
        return new Kernel(this.context, entries);
    }

    public toString(){
        return  this.context.getReplicas().map(replica => {
            const entries = [...this.entries].filter(([dot, entry]) => str2dot(dot).Replica == replica)
                .map(([dot,entry]) => `${str2dot(dot).Time}:(${entry})`).join(',');
            return `${this.context.toString(replica)} ${entries}`;
        }).join('\n');
    }

    public find(value: TEntry): DotStr | null {
        for (let entry of this.entries) {
            if (entry[1] == value)
                return entry[0];
        }
        return null;
    }

    public static with<TEntry>({kernel, delta}: KernelDelta<TEntry>, replica: Replica, value: TEntry) : KernelDelta<TEntry>{
        const {dot, context} = kernel.context.nextDot(replica);
        const dotStr = dotToString(dot);
        return {
            kernel: new Kernel<TEntry>(context, kernel.entries.with([dotStr, value])),
            delta: new Kernel<TEntry>(
                (delta?.context ?? Context.Zero).with(dotStr).compact(),
                (delta?.entries ?? new Map()).with([dotStr, value])
            )
        };
    }

    public static without<TEntry>({kernel, delta}: KernelDelta<TEntry>, value: TEntry): KernelDelta<TEntry> {
        const existed = kernel.find(value);
        if (!existed)
            return {kernel, delta};
        const entries = kernel.entries.without(existed);
        return {
            kernel: kernel.withEntries(entries),
            delta: new Kernel(
                (delta?.context ?? Context.Zero)
                    .with(existed)
                    .compact(),
                (delta?.entries ?? new Map())
            )
        }
    }
    public static toString<TEntry>({kernel, delta}: KernelDelta<TEntry>){
        return `--------------------\n${kernel.toString()}\n\n${delta?.toString()}\n------------------`
    }
}

export type KernelDelta<TEntry> = {kernel: Kernel<TEntry>, delta?: Kernel<TEntry>}



