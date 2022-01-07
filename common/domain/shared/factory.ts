import type {Model} from "../worker/model";

export abstract class IFactory<TRootModel extends Model<any, any> = Model<any, any>> {
    public abstract GetModel<TState, TActions>(path: (string|number)[]): Model<TState, TActions>;

    public abstract get Root(): TRootModel;
}
