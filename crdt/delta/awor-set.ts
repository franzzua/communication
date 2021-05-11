import { Kernel, KernelDelta} from "../common/kernel";
import {IDeltaMergeable, ConstructorOf, Split} from "../common/mergeable";
import {Replica} from "../common/common";

export class AworSet<TEntry> extends IDeltaMergeable<Kernel<TEntry>>{

    public readonly kernel: Kernel<TEntry>;
    public readonly delta: Kernel<TEntry>;
    protected new = this.constructor as ConstructorOf<this, typeof AworSet>;
    public constructor({kernel, delta}: KernelDelta<TEntry> ) {
        super();
        this.kernel = kernel;
        this.delta = delta;
    }

    public static Zero<TEntry>() {
        return new AworSet<TEntry>({kernel: Kernel.Zero<TEntry>()});
    }


    public get values() {
        return [...this.kernel.values].orderBy(x => x as any);
    }

    public with(r: Replica, v: TEntry): this {
        const remove = Kernel.without(this, v);
        return new this.new(Kernel.with(remove, r, v));
    }

    public without(v: TEntry): this {
        return new this.new(Kernel.without(this, v));
    }

    public merge(b: this): this {
        const kernel = this.kernel.merge(b.kernel);
        const delta = this.delta?.merge(b.delta) ?? b.delta;
        return new this.new({kernel, delta});
    }

    public mergeDelta(delta: Kernel<TEntry>): this {
        return new this.new({
            kernel: this.kernel.merge(delta),
            delta: this.delta?.merge(delta) ?? delta
        });
    }

    public split(): Split<this, Kernel<TEntry>> {
        return {value: new this.new({kernel: this.kernel}), delta: this.delta};
    }

    public toString(){
        return Kernel.toString(this);
    }
}
