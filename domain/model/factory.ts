import {Container, Injectable} from "@cmmn/core";
import {ContextModel} from "./context-model";
import {IFactory, ModelAction, Model, ModelPath} from "@cmmn/domain";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {DomainModel} from "@domain/model/domain-model";

@Injectable()
export class Factory implements IFactory<DomainModel> {

    // public MessageMap = new Map<string, MessageModel>();
    // public ContextMap = new Map<string, ContextModel>();

    // private StorageMap = new Map<string, StorageModel>();

    constructor(private container: Container,
                private repository: YjsRepository) {
    }


    public Root: DomainModel = new DomainModel(this);

    public GetModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> {
        return this.Root.QueryModel<TState, TActions>(path.slice(1)) as Model<TState, TActions>;
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

