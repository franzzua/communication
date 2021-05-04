import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import {PromiseQueue} from "@infr/promise-queue";
import {diff} from "lib0";


export class BackgroundRepository implements IRepository{
    private queue = new PromiseQueue(this.main);

    constructor(private main: IRepository,
                private back: IRepository) {
    }

    public async AddMessage(message: MessageJSON): Promise<MessageJSON> {
        const backResult = await this.back.AddMessage( message);
        this.queue.add('AddMessage', message)
            .then(message => console.warn(message))
            .catch(err => console.log(err));
        return backResult;
    }

    public async Clear(): Promise<void> {
        await Promise.all([
            this.back.Clear(),
            this.main.Clear()
        ])
    }

    public async CreateContext(context: ContextJSON): Promise<ContextJSON> {
        const backResult = await this.back.CreateContext(context);
        this.queue.add('CreateContext', context)
            .then(message => console.warn(message))
            .catch(err => console.log(err));
        return backResult;
    }

    public async Init(storage: StorageJSON): Promise<StorageJSON> {
        const backResult = await this.back.Init(storage);
        this.queue.Init( storage)
            .then(result => {
                const messageMerge = mergeArrays(
                    new Map(backResult.Messages.map(x => [x.URI, x])),
                    new Map(result.Messages.map(x => [x.URI, x])),
                );
                messageMerge.added.forEach(x => this.back.AddMessage(x));
                messageMerge.removed.forEach(x => this.back.RemoveMessage(x));
                messageMerge.changes.forEach((x,y) => this.back.UpdateMessage(y));


                const contextMerge = mergeArrays(
                    new Map(backResult.Contexts.map(x => [x.URI, x])),
                    new Map(result.Contexts.map(x => [x.URI, x])),
                );
                contextMerge.added.forEach(x => this.back.CreateContext(x));
                // contextMerge.removed.forEach(x => this.back.RemoveContext(x));
                contextMerge.changes.forEach((x,y) => this.back.UpdateContext(y));
            })
            .catch(err => console.log(err));
        return backResult;
    }

    public async RemoveMessage(msg: MessageJSON): Promise<void> {
        await this.back.RemoveMessage(msg);
        await this.queue.add('RemoveMessage', msg)
            .catch(err => console.log(err));
    }

    public async UpdateContext(ctx: ContextJSON): Promise<void> {
        await this.back.UpdateContext(ctx);
        this.queue.add('UpdateContext', ctx)
            .catch(err => console.log(err));
    }

    public async UpdateMessage(msg: MessageJSON): Promise<void> {
        await this.back.UpdateMessage(msg);
        this.queue.add('UpdateMessage', msg)
            .catch(err => console.log(err));

    }

}

function mergeArrays<TItem>(from: Map<any, TItem>, to: Map<any, TItem>){
    const removed: TItem[] = [];
    const changes = new Map<TItem, Partial<TItem>>();
    for (let [key, value] of from) {
        if (!to.has(key)) {
            removed.push(value);
            continue;
        }
        const existed = to.get(key);
        to.delete(key);
        const change: Partial<TItem> = {};
        let changed = false;
        const keys = new Set([...Object.getOwnPropertyNames(value), ...Object.getOwnPropertyNames(existed)]);
        for (let key of keys){
            if (existed[key] != value[key]) {
                changed = true;
                change[key] = existed[key];
            }
        }
        if (changed){
            changes.set(existed, change);
        }
    }
    const added: TItem[] = [...to.values()];
    return {removed, added, changes};
}
