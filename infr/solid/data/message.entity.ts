import {Entity, entity, field, ValuesSet} from "solidocity";
import {Schema} from "./schema";
import {Context} from "@model";
import {Reference} from "solidocity/dist/typings/contracts";

@entity(Schema.Message)
export class MessageEntity extends Entity {

    @field(Schema.content)
    public Content: string;

    @field(Schema.date, {type: "Date"})
    public Time: Date;

    @field(Schema.author, {type: "ref"})
    public Author: Reference;

    @field(Schema.children, {type: "ref", isArray: true, isOrdered: true})
    public Context: Reference;

}