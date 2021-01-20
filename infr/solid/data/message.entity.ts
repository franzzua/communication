import {Entity, entity, field, ValuesSet} from "solidocity";
import {Schema} from "./schema";
import {Context, Message} from "@model";
import {Reference} from "solidocity/dist/typings/contracts";
import {utc} from "@hypertype/core";
import {ContextCollection} from "@infr/solid/data/context.collection";
import {ContextDocument} from "@infr/solid/data/context.document";

@entity(Schema.Message)
export class MessageEntity extends Entity {

    @field(Schema.content)
    public Content: string;

    @field(Schema.date, {type: "Date"})
    public Time: Date;

    @field(Schema.author, {type: "ref"})
    public Author: Reference;

    @field(Schema.children, {type: "ref"})
    public SubContext: Reference;


    private _message: Message;
    public get Message(): Message{
        if (!this._message) {
            const message = new Message();
            message.CreatedAt = utc(this.Time);
            message.Content = this.Content;
            message.URI = this.Id;
            message.id = this.Id;
            if (this.SubContext){
                if (ContextDocument.Map.has(this.SubContext)){
                    message.SubContext = ContextDocument.Map.get(this.SubContext).Context;
                }else{
                    console.error('not loaded sub context', this.SubContext)
                }
            }
            this._message = message;
        }
        return this._message;
    }


}