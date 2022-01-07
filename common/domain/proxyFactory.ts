import {IFactory} from "./shared/factory";
import {Model} from "./worker/model";
import {ModelProxy} from "./modelProxy";
import {Stream} from "./stream";
import {Injectable} from "@common/core";
import {ModelPath} from "./shared/types";

@Injectable()
export class ProxyFactory extends IFactory<any> {

    constructor(private stream: Stream) {
        super();
    }

    public get Root(): any {
        return ModelProxy.Create(this.stream, ['Root']);
    }
    private Instances = new Map<string, ModelProxy<any, any>>();

    public GetModel<TModel extends Model<any, any>>(path: ModelPath): TModel {
        return this.Instances.getOrAdd(path.join(':'),
            key => ModelProxy.Create(this.stream, path)) as any as TModel;
    }

}
