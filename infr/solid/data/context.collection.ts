import {Collection, collection, DocumentSet, documentSet} from "solidocity";
import {Injectable} from "@hypertype/core";
import {ContextDocument} from "@infr/solid/data/context.document";
import {Context, Storage} from "@model";
import {EventBus} from "@services";
import {string} from "lib0";

@collection()
@Injectable()
export class ContextCollection extends Collection {
    public Storage: Storage;
    private ContextMap = new Map<string, ContextDocument>();
    constructor(storage: Storage) {
        super(storage.URI);
        this.Storage = storage;
        ContextCollection.Map.set(storage.URI, this);
    }

    @documentSet(ContextDocument)
    public Contexts: DocumentSet<ContextDocument>;

    public static Map = new Map<string, ContextCollection>();
    public LinkedStorages: Storage[] = [];

    public async Init(){
        await super.Init();
        if (this.Contexts.Documents.length == 0) {
            await this.Contexts.Create('root.ttl');
        }
        for (const x of this.Contexts.Documents) {
            await x.Init();
            x.Collection = this;
            for (let message of x.Messages.Items) {
                if (!message.SubContext)
                    continue;
                const collectionURI = message.SubContext.substr(0, message.SubContext.lastIndexOf('/'))
                if (!ContextCollection.Map.has(collectionURI)){
                    this.LinkedStorages.push({
                        URI: collectionURI,
                        Root: null,
                        Type: 'solid'
                    });
                }
            }
        }
    }

    public async Link(){
        for (let document of this.Contexts.Documents) {
            await document.Link();
        }
        this.Storage.Root = this.Contexts.documentsMap.get(`${this.Storage.URI}/root.ttl`).Context;
    }

    public eventBus = new EventBus();
}