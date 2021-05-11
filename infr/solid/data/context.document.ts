import {Document, document, entity, Entity, entitySet, EntitySet, field} from "solidocity";
import {MessageEntity} from "./message.entity";
import {Context, Storage} from "@model";
import {ContextCollection} from "@infr/solid/data/context.collection";
import {ContextJSON} from "@domain";
import {DateTime} from "luxon";
import {Schema} from "./schema";
import { utc } from "@hypertype/core";

@entity(Schema.Context)
export class ContextEntity extends Entity{

    @field(Schema.date, {type: "Date"})
    public CreatedAt: Date;

    @field(Schema.updatedAt, {type: "Date"})
    public UpdatedAt: Date;

    @field(Schema.permutation, {type: "string"})
    public Permutation: string;

    @field(Schema.isRoot, {type: "string"})
    public IsRoot: string;

}

@document()
export class ContextDocument extends Document {

    constructor(uri) {
        super(uri);
        ContextDocument.Map.set(uri, this);
    }

    @entitySet(MessageEntity, {isArray: true})
    public Messages: EntitySet<MessageEntity>;

    @entitySet(ContextEntity)
    public Context: ContextEntity;

    public static Map = new Map<string, ContextDocument>();

    public Collection: ContextCollection;

    public ToJSON(): ContextJSON{
        return {
            // MessageURIs: this.Messages.Items.map(x => x.Id),
            URI: this.URI,
            id: this.URI.split('/').pop().split(".ttl")[0],
            Permutation: this.Context.Permutation,
            UpdatedAt: utc(this.Context.UpdatedAt).toISO(),
            CreatedAt: utc(this.Context.CreatedAt).toISO(),
            Sorting: null,
            StorageURI: this.Collection.folderURI,
            // ParentsURIs: [],
            IsRoot: this.Context.IsRoot == "true",
        }
    }

    public async Init(){
        await super.Init();

        this.on('update', ({reference}) => {
            this.Collection.eventBus.Notificator.OnContextChanged(reference);
        })
    }

}


