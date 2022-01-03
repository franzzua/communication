import type {Model} from "../worker/model";

export abstract class IFactory<TRootModel extends Model<any, any> = Model<any, any>> {
    public abstract GetModel<TModel extends Model<any, any>>(model: string, id: any): TModel;

    public abstract get Root(): TRootModel;
}