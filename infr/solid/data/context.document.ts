import {Document, document, entitySet, EntitySet} from "solidocity";
import {MessageEntity} from "./message.entity";
import {Context, Storage} from "@model";
import {ContextCollection} from "@infr/solid/data/context.collection";

@document()
export class ContextDocument extends Document {

    constructor(uri) {
        super(uri);
        ContextDocument.Map.set(uri, this);
    }

    @entitySet(MessageEntity, {isArray: true})
    public Messages: EntitySet<MessageEntity>;

    public static Map = new Map<string, ContextDocument>();

    private _context: Context;
    public Collection: ContextCollection;
    public get Context(): Context{
        if (!this._context){
            this._context = new Context();
            this._context.URI = this.URI;
            this._context.id = this.URI;
            this._context.Storage = this.Collection.Storage;
        }
        return this._context;
    }

    public async Init(){
        await super.Init();

        this.on('update', ({reference}) => {
            this.Collection.eventBus.Notificator.OnContextChanged(reference);
        })
    }

    async Link() {
        this.Context.Messages = this.Messages.Items.map(x => x.Message);
        this.Context.Messages.forEach(m => m.Context = this.Context);
    }
}

