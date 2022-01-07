import {ICellx} from "cellx";
import {Model} from "./worker/model";
import {Stream} from "./stream";
import {ModelPath} from "./shared/types";

export class ModelProxy<TState, TActions extends object> extends Model<TState, TActions> {

    protected constructor(private stream: Stream, private path: ModelPath) {
        super();
    }

    private cell: ICellx<TState> = this.stream.getCell(this.path);

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
        return ModelProxy.Create(this.stream, [this.path, path].flat());
    }

    public static useStructure(structure: any): void {
        console.warn('structure', structure);
        for (const key in structure) {
            const value = structure[key];
            this.ModelProxyConstructors.getOrAdd(key, () => this.CreateConstructor([key], value));
        }
    }

    private static CreateConstructor(path: ModelPath, keys) {
        const extModelProxy = class extends ModelProxy<any, any> {
        };
        for (const key in keys) {
            Object.defineProperty(extModelProxy.prototype, key, {
                get(this: ModelProxy<any, any>) {
                    return new ModelMap(this.stream, keys[key]);
                }
            });
        }
        return extModelProxy as typeof ModelProxy;
    }

    private static ModelProxyConstructors = new Map<string, typeof ModelProxy>();

    public static Create(stream: Stream, path: ModelPath) {
        const existed = this.ModelProxyConstructors.get(path.join(':'));
        if (!existed) {
            return new ModelProxy(stream, path);
        }
        return new existed(stream, path);
    }
}

class ModelMap {
    constructor(private stream: Stream, private path: ModelPath) {
    }

    get(id: string | number) {
        return ModelProxy.Create(this.stream, [...this.path, id]);
    }
}
