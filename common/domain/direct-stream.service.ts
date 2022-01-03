import {Injectable} from "@hypertype/core";
import {Stream} from "./stream";
import {IFactory} from "./shared/factory";
import {Action} from "./shared/types";

@Injectable()
export class DirectStream extends Stream {
    constructor(private factory: IFactory) {
        super();
    }

    Invoke(action: Action) {
        return this.factory.GetModel(action.model, action.id)
            .QueryModel(action.path)
            .Actions[action.action](...action.args);
    }

    getCell(model: string, id: any) {
        return this.factory.GetModel(model, id).$state;
    }
}
