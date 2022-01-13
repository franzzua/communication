import {Injectable} from "@common/core";
import {Stream} from "./stream";
import {IFactory} from "./shared/factory";
import {Action} from "./shared/types";
import {Cell, cellx} from "cellx";

@Injectable()
export class DirectStream extends Stream {
    constructor(private factory: IFactory) {
        super();
    }

    async Invoke(action: Action) {
        await Promise.resolve();
        return this.factory.GetModel(action.path).Actions[action.action](...action.args);
    }

    getCell(path: (string|number)[]) {
        const result = cellx(() => {
            return this.factory.GetModel(path).State;
        }, {
            put: async (cell,value) => {
                this.factory.GetModel(path).State = value;
            }
        });
        return result;
    }
}
