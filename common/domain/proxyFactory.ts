import {IFactory} from "./factory";
import {Model} from "./model";
import {ModelProxy} from "./modelProxy";
import {Stream} from "./stream";
import * as stream from "stream";

export class ProxyFactory extends IFactory<any> {

    constructor(private stream: Stream) {
        super();
    }

    public get Root(): any {
        return new ModelProxy('root', null, this.stream);
    }

    public GetModel<TModel extends Model<any, any>>(model: string, id: any): TModel {
        return new ModelProxy(model, id, this.stream) as any as TModel;
    }

}