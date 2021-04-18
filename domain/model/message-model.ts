import {ContextModel} from "@domain/model/context-model";
import { Model } from "@hypertype/domain";
import { Message } from "@model";
import {Injectable} from "@hypertype/core";
import { MessageJSON } from "@domain/contracts/json";
import {StorageModel} from "@domain/model/storage-model";
import {IFactory} from "@domain/model/i-factory";
import {IRepository} from "@domain/contracts/repository";

@Injectable(true)
export class MessageModel extends Model<MessageJSON, any> {

    //region public Context: Context
    private _Context: ContextModel;
    public get Context(): ContextModel {
        return this._Context;
    }

    public set Context(value: ContextModel) {
        if (value == null && this._Context == null || value === this._Context){
            return;
        }
        if (value == null && this._Context != null){
            // @ts-ignore
            this._Context.Messages.remove(this);
            this.State.Context = null;
        }else{
            // @ts-ignore
            value.Messages.unshift(this);
            this.State.Context = value.State;
        }
        this._Context = value;
    }
    //endregion
    //region public SubContext: SubContext
    private _SubContext: ContextModel | null;
    public get SubContext(): ContextModel | null {
        return this._SubContext;
    }

    public set SubContext(value: ContextModel | null) {
        if (value == null && this._SubContext == null || value === this._SubContext){
            return;
        }
        if (value == null && this._SubContext != null){
            // @ts-ignore
            this._SubContext.Parents.remove(this);
            this.State.SubContext = null;
        }else{
            // @ts-ignore
            value.Parents.unshift(this);
            this.State.SubContext = value.State;
        }
        this._SubContext = value;
    }
    //endregion

    public readonly State: Message = {} as any;
    public Storage: StorageModel;
    public get URI(): string {return  this.State.URI; }

    constructor(protected factory: IFactory) {
        super();
    }

    public FromJSON(state: MessageJSON): any {
        Object.assign(this.State, {
            Content: state.Content,
            Description: state.Description,
            // Author: {URI: state.AuthorURI},
            CreatedAt: state.CreatedAt,
            Action: state.Action,
            URI: state.URI,
        });
        this.Context = this.factory.GetContext(state.ContextURI);
        if (state.SubContextURI) {
            this.SubContext = this.factory.GetContext(state.SubContextURI);
        }
    }

    public ToJSON(): MessageJSON {
        return {
            Content: this.State.Content,
            Description: this.State.Description,
            AuthorURI: this.State.Author?.URI,
            CreatedAt: this.State.CreatedAt,
            Action: this.State.Action,
            URI: this.State.URI,
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
    }


    public async Attach(uri: string): Promise<void> {
        await this.Storage.repository.UpdateMessage({
            ...this.ToJSON(),
            StorageURI: this.Storage.URI,
            SubContextURI: uri
        });
        this.SubContext = this.factory.GetContext(uri);
    }
}

