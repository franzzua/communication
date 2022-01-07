import {Action, ModelPath} from "./shared/types";

export abstract class Stream {
    public abstract Invoke(action: Action);

    public abstract getCell(path: ModelPath);

}

