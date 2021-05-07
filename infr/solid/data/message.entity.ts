import {Entity, entity, field, ValuesSet} from "solidocity";
import {Schema} from "./schema";
import {Context, Message} from "@model";
import {Reference} from "solidocity/dist/typings/contracts";
import {utc} from "@hypertype/core";
import {ContextCollection} from "@infr/solid/data/context.collection";
import {ContextDocument} from "@infr/solid/data/context.document";
import {MessageJSON} from "@domain";
import {DateTime} from "luxon";

@entity(Schema.Message)
export class MessageEntity extends Entity {

    Document: ContextDocument;

    @field(Schema.content)
    public Content: string;

    @field(Schema.date, {type: "Date"})
    public CreatedAt: Date;

    @field(Schema.author, {type: "ref"})
    public Author: Reference;

    @field(Schema.children, {type: "ref"})
    public SubContext: Reference;

    @field(Schema.order, {type: "decimal"})
    public Order: number;

    @field(Schema.updatedAt, {type: "Date"})
    public UpdatedAt: Date;

    public ToJSON(): MessageJSON{
        return {
            CreatedAt: this.CreatedAt && utc(this.CreatedAt).toISO(),
            UpdatedAt: this.UpdatedAt && utc(this.UpdatedAt).toISO(),
            Content: this.Content,
            URI: this.Id,
            id: this.Id,
            SubContextURI: this.SubContext,
            ContextURI: this.Document.URI,
            Order: this.Order,
            StorageURI: this.Document.Collection.folderURI,
        }
    }
}
