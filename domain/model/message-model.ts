import {ContextModel} from "@domain/model/context-model";
import {Injectable, utc} from "@hypertype/core";
import { MessageJSON } from "@domain/contracts/json";
import {StorageModel} from "@domain/model/storage-model";
import {IFactory} from "@domain/model/i-factory";
import {IMessageActions} from "@domain/contracts/actions";
import { Message} from "@model";

@Injectable(true)
export class MessageModel implements IMessageActions {
    //
    // public Context: ContextModel;
    // public SubContext: ContextModel | null;

    public get Context(){
        return this.factory.GetContext(this.State.Context.URI);
    }
    public get SubContext(){
        return this.factory.GetContext(this.State.SubContext?.URI);
    }

    public get URI(): string {return  this.State.URI; }

    constructor(private readonly factory: IFactory,
                public readonly Storage: StorageModel,
                public readonly State: Message) {

    }

    public Update(json: MessageJSON){
        Object.assign(this.State, Message.FromJSON(json));

    }

    public ToJSON(): MessageJSON {
        return Message.ToJSON(this.State);
    }

    public async UpdateText(text: string): Promise<void> {
        this.State.UpdatedAt = utc();
        this.State.Content = text;
        await this.Storage.repository.Messages.Update(this.ToJSON());
        this.Storage.Update();
    }


    public async Attach(uri: string): Promise<void> {
        this.State.UpdatedAt = utc();
        this.State.SubContext = this.factory.GetContext(uri)?.State;
        this.State.SubContext.Parents.unshift(this.State);
        await this.Storage.repository.Messages.Update(this.ToJSON());
    }

    public async Move(fromURI, toURI, toIndex: number){
        const oldContext = this.Context;
        if (oldContext)
            oldContext.State.Messages.remove(this.State)
        this.State.Context = this.Storage.Contexts.get(toURI).State;
        this.State.Context.Messages.push(this.State);
        await this.Reorder(toIndex);
    }

    public async Reorder(newOrder: number): Promise<void>{
        if (!this.Context)
            return ;
        this.State.Context.Messages.remove(this.State);
        if (this.State.Context.Messages.length == 0){
            this.State.Order = 0;
        } else if (newOrder == 0){
            this.State.Order = Math.min(...this.State.Context.Messages.map(x => x.Order)) - 1;
        } else if (newOrder >= this.State.Context.Messages.length){
            this.State.Order = Math.max(...this.State.Context.Messages.map(x => x.Order)) + 1;
        } else {
            const prev = this.State.Context.Messages[newOrder - 1].Order;
            const next = this.State.Context.Messages[newOrder].Order;
            this.State.Order = (next > prev + 1) ? prev + 1 : (next + prev)/2;
        }
        this.State.Context.Messages.splice(newOrder, 0, this.State);
        this.State.UpdatedAt = utc();
        await this.Storage.repository.Messages.Update(this.ToJSON());
    }
}

