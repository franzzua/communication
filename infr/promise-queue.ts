import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import {Change, ChangesStorage} from "@infr/changes-storage";
import {award} from "rdf-namespaces/dist/schema";

export class PromiseQueue {

    private chageStorage = new ChangesStorage();

    constructor(private main: IRepository) {

    }

    private queue: (() => Promise<void>)[] = [];
    private isInvoking = false;

    private Invoke() {
        if (this.isInvoking || this.queue.length == 0)
            return;
        this.isInvoking = true;
        const current = this.queue.shift();
        setTimeout(() => {
            current().then(() => {
                this.isInvoking = false;
                this.Invoke();
            });
        }, 1000);
    }

    protected FixResult(action: keyof IRepository, args: any, result: any) {
        switch (action) {
            case "AddMessage":
            case "CreateContext":
                const entity = args as MessageJSON | ContextJSON;
                const {URI} = result;
                this.uriMap.set(entity.URI, URI);
                entity.URI = URI;
        }
    }
    protected FixArgs(action: keyof IRepository, args: any){
        switch (action){
            case "AddMessage":
            case "UpdateMessage":
            case "RemoveMessage":
                const message = args as MessageJSON;
                message.ContextURI = this.uriMap.get(message.ContextURI) ?? message.ContextURI;
                message.SubContextURI = this.uriMap.get(message.SubContextURI) ?? message.SubContextURI;
                break;
        }
    }

    private initResolve: Function;
    private init$ = new Promise(resolve => this.initResolve = resolve);

    public async add(method: keyof IRepository, args) {
        await this.init$;
        const change = {
            Action: method,
            //add storage uri
            Args: args,
        } as Change;
        await this.chageStorage.Add(change);
        return this.applyChange(change);
    }
    private applyChange(change: Change){
        return new Promise<any>((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    this.FixArgs(change.Action, change.Args);
                    const res = await this.main[change.Action](change.Args);
                    this.FixResult(change.Action, change.Args, res);
                    change.id && await this.chageStorage.Remove(change.id);
                    resolve(res);
                } catch (e) {
                    change.id && await this.chageStorage.Remove(change.id);
                    reject(e);
                }
            });
            this.Invoke();
        });
    }

    private uriMap = new Map<string, string>();

    public async Init(storage: StorageJSON): Promise<StorageJSON> {
        await this.main.Init(storage);
        await this.chageStorage.Init();
        const changes = await this.chageStorage.GetAll();
        this.isInvoking = false;
        await Promise.all(changes.map(x => this.applyChange(x)));
        this.isInvoking = true;
        const res = await this.main.Init(storage);
        this.initResolve();
        return res;
    }

}
