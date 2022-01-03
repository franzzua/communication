import {ICellx} from "cellx";
import {Model} from "./model";
import {Stream} from "./stream";

export class ModelProxy<TState, TActions extends object> extends Model<TState, TActions> {

    constructor(private stream: Stream, private model: string, private id: any, private path = []) {
        super();
    }

    private cell: ICellx<TState> = this.stream.getCell(this.model, this.id);

    public get State(): TState {
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
                return this.Invoke(key, arguments)
            }.bind(this);
        }
    });

    private Invoke(action: string, args: any[]): Promise<any> {
        return this.stream.Invoke({
            path: this.path,
            model: this.model,
            id: this.id,
            args, action
        });
    }

    public QueryModel(path: (string | number)[], current: any = this): any {
        return new ModelProxy(this.stream, this.model, this.id, [this.path, path].flat());
    }
}
