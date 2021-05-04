import {Collection, collection, DocumentSet, documentSet} from "solidocity";
import {Injectable} from "@hypertype/core";
import {ContextDocument} from "@infr/solid/data/context.document";
import {Context, Storage} from "@model";
import {EventBus} from "@services";
import {string} from "lib0";
import {StorageJSON} from "@domain";

@collection()
@Injectable()
export class ContextCollection extends Collection {
    private ContextMap = new Map<string, ContextDocument>();
    public static Map = new Map<string, ContextCollection>();

    constructor(uri: string) {
        super(uri);
        ContextCollection.Map.set(uri, this);
    }

    @documentSet(ContextDocument)
    public Contexts: DocumentSet<ContextDocument>;

    public LinkedStorages: StorageJSON[] = [];

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
                        Type: 'solid',
                        Messages: [],
                        Contexts: []
                    });
                }
            }
        }
    }

    public eventBus = new EventBus();

    public ToJSON(): StorageJSON{
        const contexts = this.Contexts.Documents.map(x => x.ToJSON());
        const messages = this.Contexts.Documents.flatMap(x => x.Messages.Items).map(x => x.ToJSON());
        contexts.forEach(x => x.ParentsURIs = messages.filter(x => x.SubContextURI == x.URI).map(x => x.URI));
        return {
            URI: this.URI,
            Type: 'solid',
            Contexts: contexts,
            Messages: messages
        };
    }
}
