export abstract class Stream {
    public abstract Invoke(action: Action);

    public abstract getCell(model: string, id: any);

}

export type Action = {
    // Model name, unique
    model: string;
    // Model id, unique
    id: any;
    // Subpath of internal entity of model
    path: (string | number)[];
    action: string;
    args: any[]
}
