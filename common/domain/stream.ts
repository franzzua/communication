import {Action} from "./shared/types";

export abstract class Stream {
    public abstract Invoke(action: Action);

    public abstract getCell(model: string, id: any);

}

