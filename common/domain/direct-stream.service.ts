import {Injectable} from "@hypertype/core";
import {Action, Stream} from "./stream";
import {IFactory} from "./factory";

@Injectable()
export class DirectStream extends Stream {
    constructor(private factory: IFactory) {
        super();
    }

    Invoke(action: Action) {
        return this.factory.GetModel(action.model, action.id).Actions[action.action](...action.args);
    }

    getCell(model: string, id: any) {
        return this.factory.GetModel(model, id).$state;
    }
}