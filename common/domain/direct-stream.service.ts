import {Injectable} from "@common/core";
import {Stream} from "./stream";
import {IFactory} from "./shared/factory";
import {Action} from "./shared/types";

@Injectable()
export class DirectStream extends Stream {
    constructor(private factory: IFactory) {
        super();
    }

    Invoke(action: Action) {
        return this.factory.GetModel(action.path).Actions[action.action](...action.args);
    }

    getCell(path: (string|number)[]) {
        return this.factory.GetModel(path).$state;
    }
}
