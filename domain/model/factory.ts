import {Message} from "@model";
import {Container, Injectable} from "@common/core";
import {ContextModel} from "./context-model";
import type {IFactory} from "@common/domain/worker";
import {MessageModel} from "@domain/model/message-model";
import {YjsRepository} from "@infr/y/yjsRepository";
import {DomainModel} from "@domain/model/domain-model";
import {ModelPath} from "../../common/domain/shared/types";

@Injectable()
export class Factory implements IFactory<DomainModel> {

    // public MessageMap = new Map<string, MessageModel>();
    // public ContextMap = new Map<string, ContextModel>();

    // private StorageMap = new Map<string, StorageModel>();

    constructor(private container: Container,
                private repository: YjsRepository) {
    }

    public get Root() {
        return this.container.get<DomainModel>(DomainModel);
    }

    public GetModel(path: ModelPath) {
        return this.Root.QueryModel(path.slice(1));
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

