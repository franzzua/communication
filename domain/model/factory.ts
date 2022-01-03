import {Message} from "@model";
import {Container, Injectable} from "@common/core";
import {ContextModel} from "./context-model";
import type {IFactory} from "@common/domain/worker";
import {MessageModel} from "@domain/model/message-model";
import {YjsRepository} from "@infr/y/yjsRepository";
import {DomainModel} from "@domain/model/domain-model";

@Injectable()
export class Factory implements IFactory<DomainModel> {

    private MessageMap = new Map<string, MessageModel>();
    private ContextMap = new Map<string, ContextModel>();

    // private StorageMap = new Map<string, StorageModel>();

    constructor(private container: Container,
                private repository: YjsRepository) {
    }

    public get Root() {
        return this.container.get<DomainModel>(DomainModel);
    }

    public GetModel(model: string, id: any) {
        switch (model.toLowerCase()) {
            case 'root':
            case 'domain':
                return this.container.get<DomainModel>(DomainModel);
            case 'context':
                return this.GetOrCreateContext(id) as any;
            case 'message':
                return this.GetMessage(id) as any;
        }
        throw new Error();
    }

    public GetOrCreateMessage(state: Message): MessageModel {
        if (this.MessageMap.has(state.id))
            return this.MessageMap.get(state.id);
        const contextStore = this.repository.LoadContext(state.Context.URI);
        const message = new MessageModel(this, contextStore, state.id);
        message.State = state;
        // message.Link(this.GetContext(state.Context.URI), state.SubContext ? this.GetContext(state.SubContext.URI) : null);
        // message.FromJSON(state);
        this.MessageMap.set(state.id, message);
        return message;
    }

    public GetOrCreateContext(uri: string): ContextModel {
        const existed = this.ContextMap.get(uri);
        if (existed)
            return existed;
        const contextStore = this.repository.LoadContext(uri);
        // const cell =cellx(() => {
        //     const state = $context();
        //     const context = Context.FromJSON(state.Context);
        //     context.Messages = state.Messages.map(Message.FromJSON);
        //     return context;
        // }, {
        //     put(cell, next: Context, value) {
        //         $context({
        //             Context: Context.ToJSON(next),
        //             Messages: next.Messages.map(Message.ToJSON),
        //         });
        //     }
        // })
        const context = new ContextModel(uri, contextStore, this);
        this.ContextMap.set(uri, context);
        return context;
    }

    //
    // public GetStorage(uri: string): StorageModel{
    //     return this.StorageMap.get(uri);
    // }

    public GetContext(uri: string): ContextModel {
        return this.ContextMap.get(uri);
    }

    public GetMessage(uri: string): MessageModel {
        return this.MessageMap.get(uri);
    }

    RemoveMessage(id: string) {
        this.MessageMap.delete(id);
    }
}

