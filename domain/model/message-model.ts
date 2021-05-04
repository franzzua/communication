import {ContextModel} from "@domain/model/context-model";
import { Model } from "@hypertype/domain";
import { Message } from "@model";
import {Injectable} from "@hypertype/core";
import { MessageJSON } from "@domain/contracts/json";
import {StorageModel} from "@domain/model/storage-model";
import {IFactory} from "@domain/model/i-factory";
import {IRepository} from "@domain/contracts/repository";
import {IMessageActions} from "@domain/contracts/actions";

@Injectable(true)
export class MessageModel extends Model<MessageJSON, IMessageActions> implements IMessageActions {

    public Context: ContextModel;
    public SubContext: ContextModel | null;

    public State: Omit<MessageJSON, keyof {"ContextURI", "SubContextURI", "Storage"}>;
    public Storage: StorageModel;
    public get URI(): string {return  this.State.URI; }

    constructor(protected factory: IFactory) {
        super();
    }

    public FromJSON(state: MessageJSON): any {
        this.State = state;
    }

    public ToJSON(): MessageJSON {
        return {
            ...this.State,
            StorageURI: this.Storage.State.URI,
            ContextURI: this.Context?.URI,
            SubContextURI: this.SubContext?.URI
        };
    }

    public async UpdateText(text: string): Promise<void> {
        await this.Storage.repository.UpdateMessage({
            ...this.ToJSON(),
            Content: text
        });
        this.State.Content = text;
        this.Storage.Update();
    }


    public async Attach(uri: string): Promise<void> {
        await this.Storage.repository.UpdateMessage({
            ...this.ToJSON(),
            StorageURI: this.Storage.URI,
            SubContextURI: uri
        });
        this.SubContext = this.factory.GetContext(uri);
        this.SubContext.Parents.unshift(this);
    }

    public async Move(fromURI, toURI, toIndex: number){
        const oldContext = this.Context;
        if (oldContext)
            oldContext.Messages.remove(this)
        this.Context = this.Storage.Contexts.get(toURI);
        this.Context.Messages.splice(toIndex, 0, this);
        await Promise.all([
            this.Storage.repository.UpdateMessage(this.ToJSON()),
            this.Storage.repository.UpdateContext(this.Context.ToJSON()),
            oldContext ? this.Storage.repository.UpdateContext(oldContext.ToJSON()): Promise.resolve(),
        ]);
    }

    public async Reorder(newOrder: number): Promise<void>{
        if (!this.Context)
            return ;
        this.Context.Messages.remove(this);
        this.Context.Messages.splice(newOrder, 0, this);
        await this.Storage.repository.UpdateContext(this.Context.ToJSON());
    }
}

