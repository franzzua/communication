export abstract class Stream {
    public abstract Invoke(action: Action);

    public abstract getCell(model: string, id: any);

}

export type Action = {
    model: string;
    id: any;
    action: string;
    args: any[]
}