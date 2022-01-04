import {IFactory} from "./shared/factory";
import {Model} from "./worker/model";
import {ModelProxy} from "./modelProxy";
import {Stream} from "./stream";
import {Injectable} from "@common/core";

@Injectable()
export class ProxyFactory extends IFactory<any> {

    constructor(private stream: Stream) {
        super();
    }

    public get Root(): any {
        return new ModelProxy(this.stream, 'root', null);
    }

    public GetModel<TModel extends Model<any, any>>(model: string, id: any): TModel {
        return new ModelProxy(this.stream, model, id) as any as TModel;
    }

}
