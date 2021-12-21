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

    public get id(): string {return  this.State.id; }

    constructor(private readonly factory: IFactory,
                public readonly Storage: StorageModel,
                public readonly State: Omit<Message, keyof {Context, SubContext, Storage}>) {
        super();
    }

    public Link(context: ContextModel, subContext: ContextModel){
        if (this._context !== context){
            this._context?.DetachMessage(this, 'force');
            this._context = context;
            this._context?.AddChild(this, 'force');
        }
        if (this._subContext !== subContext) {
            this._subContext?.DetachFrom(this, 'force');
            this._subContext = subContext;
            this._subContext?.AddParent(this, 'force');
        }
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
        this.State.UpdatedAt = utc();
        this.State.Content = text;
        await this.Save();
    }


    public async Attach(uri: string): Promise<void> {
        this.State.UpdatedAt = utc();
        this._subContext = this.factory.GetContext(uri);
        this._subContext.AddParent(this);
        await this.Save();
    }

    public async Move(fromURI, toURI, toIndex: number){
        if (fromURI == toURI)
            return await  this.Reorder(toIndex);
        const oldContext = this.Storage.Contexts.get(fromURI);
        if (oldContext) {
            await oldContext.RemoveMessage(this.id);
            await oldContext.Save();
        }
        const context = this.Storage.Contexts.get(toURI);
        await this.Storage.CreateMessage({
            ...this.State,
            Context: context.State,
            SubContext: this.SubContext?.State,
        } as Message);
        await this.Reorder(toIndex);
    }

    public async Reorder(newOrder: number): Promise<void>{
        if (!this.Context)
            return ;
        this._context.DetachMessage(this);
        this._context.AttachMessage(this, newOrder);
        await this._context.Save();
    }

    private async Save(){
        await this.Storage.repository.Messages.Update(this.ToServer());
    }
}

