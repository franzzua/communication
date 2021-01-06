import {Action} from "@services";

export class BaseActions {


    protected flatObject(obj, ...keys): ([string, Action])[] {
        return Object.entries(obj).flatMap(([key, value]) => {
            const newKeys = [...keys, key];
            if (typeof value === "object")
                return this.flatObject(value, ...newKeys);
            return [[newKeys.join('.'), value as Action]];
        });
    }

}