import {ContextModel} from "@domain/model/context-model";
import {Injectable, utc} from "@hypertype/core";
import { MessageJSON } from "@domain/contracts/json";
import {StorageModel} from "@domain/model/storage-model";
import {IFactory} from "@domain/model/i-factory";
import {IMessageActions} from "@domain/contracts/actions";
import { Message} from "@model";
import {Model} from "@hypertype/domain";

@Injectable(true)
export class MessageModel extends Model<Message, IMessageActions> implements IMessageActions {

    private _context: ContextModel;
    public get Context(){
        return this._context;
    }
    private _subContext: ContextModel;
    public get SubContext() {
        return this._subContext;
    }

    public get URI(): string {return  this.State.URI; }

    constructor(private readonly factory: IFactory,
                public readonly Storage: StorageModel,
                public readonly State: Omit<Message, keyof {Context, SubContext, Storage}>) {
        super();
    }

    public Link(context: ContextModel, subContext: ContextModel){
        this._context = context;
        this._subContext = subContext;
    }

    public FromServer(json: MessageJSON){
        Object.assign(this.State, Message.FromJSON(json));
    }

    FromJSON(state: Message): any {
        Object.assign(this.State, state);
    }

    public ToJSON(): Message {
        return {
            ...this.State,
            Context: null,
            SubContext: null,
            equals: Message.equals(this.State)
        };
    }

    public ToServer(){
        return {
            ...Message.ToJSON(this.State),
            ContextURI: this.Context.URI,
            SubContextURI: this.SubContext?.URI,
            StorageURI: this.Storage?.URI
        };
    }

    public async UpdateText(text: string): Promise<void> {
        this.Storage.domain.lastUpdate = utc();
        this.State.UpdatedAt = utc();
        this.State.Content = text;
        await this.Storage.repository.Messages.Update(this.ToServer());
    }


    public async Attach(uri: string): Promise<void> {
        this.Storage.domain.lastUpdate = utc();
        this.State.UpdatedAt = utc();
        this._subContext = this.factory.GetContext(uri);
        this._subContext.AddParent(this);
        await this.Storage.repository.Messages.Update(this.ToServer());
    }

    public async Move(fromURI, toURI, toIndex: number){
        this.Storage.domain.lastUpdate = utc();
        if (fromURI == toURI)
            return await  this.Reorder(toIndex);
        const oldContext = this.Storage.Contexts.get(fromURI);
        if (oldContext)
            oldContext.DetachMessage(this)
        this._context = this.Storage.Contexts.get(toURI);
        this._context.AttachMessage(this, toIndex);
        await this._context.Save();
    }

    public async Reorder(newOrder: number): Promise<void>{
        this.Storage.domain.lastUpdate = utc();
        if (!this.Context)
            return ;
        this._context.DetachMessage(this);
        this._context.AttachMessage(this, newOrder);
        await this._context.Save();
    }
}

