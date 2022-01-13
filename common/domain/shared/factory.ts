import type {Model} from "../worker/model";
import {ModelPath} from "./types";

export abstract class IFactory<TRootModel extends Model<any, any> = Model<any, any>> {
    public abstract GetModel<TState, TActions>(path: ModelPath): Model<TState, TActions>;

    public abstract get Root(): TRootModel;
}
