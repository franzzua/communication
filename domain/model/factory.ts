import {Container, Injectable} from "@cmmn/core";
import {ContextModel} from "./context-model";
import {ModelPath, Locator, ModelLike} from "@cmmn/domain/worker";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {DomainModel} from "@domain/model/domain-model";

@Injectable()
export class Factory extends Locator {

    constructor(private container: Container,
                private repository: YjsRepository) {
        super()
    }


    public Root: DomainModel = new DomainModel(this);

    get(path: ModelPath): ModelLike<any, any> {
        if (path.length == 0)
            return this.Root;
        if (path.length % 2 == 1)
            return this.GetOrCreateContext(path.pop() as string);
        return this.Root.Contexts.get(path[path.length - 2] as string)
            .Messages.get(path[path.length - 1] as string);
    }

    //
    // public GetOrCreateMessage(state: Message): MessageModel {
    //     if (this.MessageMap.has(state.id))
    //         return this.MessageMap.get(state.id);
    //     const contextStore = this.repository.LoadContext(state.ContextURI);
    //     const message = new MessageModel(this, contextStore, state.id);
    //     message.State = state;
    //     // message.Link(this.GetContext(state.Context.URI), state.SubContext ? this.GetContext(state.SubContext.URI) : null);
    //     // message.FromJSON(state);
    //     this.MessageMap.set(state.id, message);
    //     return message;
    // }

    public GetOrCreateContext(uri: string): ContextModel {
        const existed = this.Root.ObsContexts.get(uri);
        if (existed)
            return existed;
        return this.CreateContext(uri);
    }

    public CreateContext(uri: string) {
        const contextStore = this.repository.LoadContext(uri);
        const context = new ContextModel(uri, contextStore, this);
        this.Root.ObsContexts.set(uri, context);
        return context;
    }

    //
    // public GetStorage(uri: string): StorageModel{
    //     return this.StorageMap.get(uri);
    // }

    public GetContext(uri: string): ContextModel {
        return this.Root.ObsContexts.get(uri);
    }

    //
    // public GetMessage(id: string): MessageModel {
    //     return this.MessageMap.get(id);
    // }
    //
    // RemoveMessage(id: string) {
    //     this.MessageMap.delete(id);
    // }
}

