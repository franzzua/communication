import {Entity, entity, field} from "solidocity";
import {Schema} from "./schema";
import {Reference} from "solidocity/dist/typings/contracts";
import {utc} from "@hypertype/core";
import {MessageJSON} from "@domain";

@entity(Schema.Message)
export class MessageEntity extends Entity {

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

    @field(Schema.isDeleted, {type: "string"})
    public IsDeleted: '' | 'deleted';

    public FromJSON(json: Partial<MessageJSON>) {
        if ('Content' in json)
            this.Content = json.Content;
        if ('Order' in json)
            this.Order = json.Order;
        if ('SubContextURI' in json)
            this.SubContext = json.SubContextURI;
        if ('CreatedAt' in json)
            this.CreatedAt = utc(json.CreatedAt).toJSDate();
        if ('UpdatedAt' in json)
            this.UpdatedAt = utc(json.UpdatedAt).toJSDate();
    }

    public ToJSON(): MessageJSON {
        return {
            CreatedAt: this.CreatedAt && utc(this.CreatedAt).toISO(),
            UpdatedAt: this.UpdatedAt && utc(this.UpdatedAt).toISO(),
            Content: this.Content,
            id: this.Id,
            SubContextURI: this.SubContext,
            Order: this.Order,
            StorageURI: null,
            ContextURI: null
        }
    }
}
