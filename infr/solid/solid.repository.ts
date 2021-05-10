import * as h from "@hypertype/core";
import {Subject, switchThrottle, utc} from "@hypertype/core";
import {ContextCollection} from "./data/context.collection";
import {ContextDocument} from "@infr/solid/data/context.document";
import {EventBus} from "@services";
import {Profile} from "solidocity";
import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import {queueCRD} from "./solid.queue";

export class SolidRepository implements IRepository {

    public isOffline = true;
    private collection = new ContextCollection(this.storageURI);
    private ChangedDocs = new Set<ContextDocument>();

    public Init$ = this.collection.Init();

    public async Load(): Promise<StorageJSON> {
        await this.Init$;
        return this.collection.ToJSON();
    }

    public EventBus = new EventBus();

    constructor(private storageURI: string) {
        window.addEventListener('beforeunload', () => {
            this.SaveDocsNow()
        })
    }

    public async Unload() {
        await this.collection.Unsubscribe();
    }

    public static async CreateDefaultStorage(session, clean = false) {
        const profile = new Profile(session.webId);
        await profile.Init();
        const repository = new SolidRepository(`${profile.Me.Storage}context`);
        const storage = await repository.Load();
        return storage;
    }

    private isTransaction = false;

    public Contexts = queueCRD({
        Create: async (context: ContextJSON) => {
            const contextDocument = await this.collection.Contexts.Create(`${context.id}.ttl`);
            contextDocument.Context.CreatedAt = utc(context.CreatedAt).toJSDate();
            contextDocument.Context.UpdatedAt = utc(context.UpdatedAt).toJSDate();
            contextDocument.Context.IsRoot = "true";
            contextDocument.Context.Save();
            context.URI = contextDocument.URI;
            ContextDocument.Map.set(context.URI, contextDocument);
            await this.SaveDocsNow();
        },
        Update: async (changes: Partial<ContextJSON>) => {
            const contextDocument = ContextDocument.Map.get(changes.URI);
            // if ('UpdatedAt' in changes)
            contextDocument.Context.UpdatedAt = utc(changes.UpdatedAt).toJSDate();
            // if ('CreatedAt' in changes)
            contextDocument.Context.CreatedAt = utc(changes.CreatedAt).toJSDate();
            // if ('Permutation' in changes)
            contextDocument.Context.Permutation = changes.Permutation;
            contextDocument.Context.Save();
            this.ChangedDocs.add(contextDocument);
            await this.SaveDocsNow();

        },
        Delete: async (context: ContextJSON) => {
            // const contextDocument = ContextDocument.Map.get(context.URI);
            // await contextDocument.Remove();
        }
    });

    public Messages = queueCRD({
        Create: async (message: MessageJSON) => {
            const contextDocument = ContextDocument.Map.get(message.ContextURI);
            await contextDocument.Loading;
            const messageEntity = contextDocument.Messages.get(message.URI) ??
                contextDocument.Messages.Add(message.id);
            messageEntity.IsDeleted = '';
            // messageEntity.Author = message.Author.URI;
            messageEntity.FromJSON(message);
            this.ChangedDocs.add(contextDocument);
            await this.SaveDocsNow();
            const check = contextDocument.Messages.get(message.URI);
            if (!check)
                throw new Error("not created");
        },
        Update: async (changes: Partial<MessageJSON>) => {
            const contextDocument = ContextDocument.Map.get(changes.ContextURI);
            const messageEntity = contextDocument.Messages.get(changes.URI);
            messageEntity.FromJSON(changes);
            messageEntity.Save();
            this.ChangedDocs.add(contextDocument);
            await this.SaveDocsNow();
        },
        Delete: async (message: MessageJSON) => {
            if (!message.URI)
                return;
            const contextDocument = ContextDocument.Map.get(message.ContextURI);
            const messageEntity = contextDocument.Messages.get(message.URI);
            messageEntity.IsDeleted = "deleted";
            messageEntity.Save();
            this.ChangedDocs.add(contextDocument);
            await this.SaveDocsNow();
        }
    });

    public UpdateContext(ctx: ContextJSON): Promise<void> {
        return Promise.resolve(undefined);
    }

    @switchThrottle(1000, {leading: false, trailing: true})
    public async SaveDocs() {
        this.SaveDocsNow()
    }

    private SaveDocsNow() {
        for (let doc of this.ChangedDocs) {
            for (let item of doc.Messages.Items) {
                item.Save();
            }
            doc.Save();
        }
        this.ChangedDocs.clear();
    }

    public async Clear() {
        await this.collection.Remove(true)
    }

    private _onNewStateSubject$ = new Subject<StorageJSON>();
    public State$ = h.from(this.Init$).pipe(
        h.map(x => this.collection.ToJSON())
    );
}

