import {Document, document, entitySet, EntitySet} from "solidocity";
import {MessageEntity} from "./message.entity";

@document()
export class ContextDocument extends Document {

    @entitySet(MessageEntity, {isArray: true})
    public Messages: EntitySet<MessageEntity>;

}

