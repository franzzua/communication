import {Document, document, entity, Entity, entitySet, EntitySet, field} from "solidocity";
import {MessageEntity} from "./message.entity";
import {Context, Storage} from "@model";
import {ContextCollection} from "@infr/solid/data/context.collection";
import {ContextJSON} from "@domain";
import {DateTime} from "luxon";
import {Schema} from "./schema";

@document()
export class ContextDocument extends Document {

    constructor(uri) {
        super(uri);
        ContextDocument.Map.set(uri, this);
    }

    @entitySet(MessageEntity, {isArray: true})
    public Messages: EntitySet<MessageEntity>;

    // @entitySet(MessageEntity, {isArray: false})
    // public Context = new ContextEntity();

    public static Map = new Map<string, ContextDocument>();

    public Collection: ContextCollection;

    public ToJSON(): ContextJSON{
        return {
            MessageURIs: this.Messages.Items.map(x => x.Id),
            URI: this.URI,
            Permutation: null,
            Sorting: null,
            StorageURI: this.Collection.folderURI,
            ParentsURIs: [],
            IsRoot: this.URI.endsWith('root.ttl')
        }
    }

    public async Init(){
        await super.Init();

        this.on('update', ({reference}) => {
            this.Collection.eventBus.Notificator.OnContextChanged(reference);
        })
    }

}

export class ContextEntity extends Entity{

    @field(Schema.updatedAt, {type: "Date"})
    public UpdatedAt: DateTime;

}

