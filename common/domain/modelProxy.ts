import {ICellx} from "cellx";
import {Model} from "./worker/model";
import {Stream} from "./stream";
import {ModelPath} from "./shared/types";

export class ModelProxy<TState, TActions extends object> extends Model<TState, TActions> {

    constructor(protected stream: Stream, public path: ModelPath) {
        super();
    }

    private cell: ICellx<TState> = this.stream.getCell(this.path);

    public get State(): Readonly<TState> {
        return this.cell();
    }

    public set State(value: TState) {
        this.cell(value);
    }

    public Actions = new Proxy({} as any as TActions, {
        get: (target, key) => {
            if (key in target)
                return target[key];
            return target[key] = function () {
                return this.Invoke(key, Array.from(arguments))
            }.bind(this);
        }
    });

    private Invoke(action: string, args: any[]): Promise<any> {
        return this.stream.Invoke({
            path: this.path,
            args, action
        });
    }

    public QueryModel(path: (string | number)[], current: any = this): any {
        return new ModelProxy(this.stream, [this.path, path].flat());
    }

}

