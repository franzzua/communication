// import {Buffer} from "buffer";
import * as h from "@hypertype/core";
import {Injectable, Subject} from "@hypertype/core";
import {IRepository} from "@domain";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
import {MeldReader, MeldStore} from "@infr/m-ld/meldStore";
import {MeldFactory} from "@infr/m-ld/meld.factory";
import {MeldReadState} from "@m-ld/m-ld";
import {ulid} from "ulid";

// Buffer.isBuffer = (x => {
//     return ArrayBuffer.isView(x) || Array.isArray(x);
// }) as any;

@Injectable(true)
export class MeldRepository implements IRepository {

    private id = ulid();

    private async getWriter(contextURI: string) {
        const meld = await MeldFactory.GetMeldClone(contextURI, this.id);
        const writer = new MeldStore(meld, this.id);
        return writer;
    }

    constructor(private storageURI: string) {
        this.Listen(storageURI);
    }


    private listened = [];

    private async Listen(uri) {
        if (this.listened.includes(uri))
            return;
        this.listened.push(uri);
        const meld = await MeldFactory.GetMeldClone(uri, this.id);
        meld.read((state) => {
            this.stateSubject$.next(state);
        }, async (update, state) => {
            const writer = update["@insert"].find(x => x["@id"] == 'writer').value;
            if (writer == this.id)
                return;
            this.stateSubject$.next(state);
            console.log('update', update, writer)
        });
    }

    public async Load(): Promise<StorageJSON> {
        return {
            URI: this.storageURI,
            Type: 'local',
            Contexts: [],
            Messages: []
        };
    }

    public Contexts = {
        Create: async (context: ContextJSON) => {
            const writer = await this.getWriter(this.storageURI);
            await writer.CreateContext(context);
            await MeldFactory.GetMeldClone(context.URI, this.id, true);
            this.Listen(context.URI);
        },
        Update: async (changes: Partial<ContextJSON>) => {
            const writer = await this.getWriter(this.storageURI);
            await writer.UpdateContext(changes);
        },
        Delete: async (context: ContextJSON) => {
        }
    }

    public Messages = {
        Create: async (message: MessageJSON) => {
            const writer = await this.getWriter(message.ContextURI);
            await writer.AddMessage(message);
        },
        Update: async (changes: Partial<MessageJSON>) => {
            const writer = await this.getWriter(changes.ContextURI);
            await writer.UpdateMessage(changes);
        },
        Delete: async (message: MessageJSON) => {
            const writer = await this.getWriter(message.ContextURI);
            await writer.DeleteMessage(message);
        }
    }


    public async Clear(): Promise<void> {
    }

    protected stateSubject$ = new Subject<MeldReadState>();

    public State$ = this.stateSubject$.asObservable().pipe(
        h.tap(console.log),
        h.concatMap(() => this.readState()),
        h.tap(console.log),
    )

    private async readState() {
        const meld = await MeldFactory.GetMeldClone(this.storageURI, this.id);
        const reader = new MeldReader(meld);
        const contexts = await reader.GetContexts();
        const messages = [];
        for (let context of contexts) {
            const meld = await MeldFactory.GetMeldClone(context.URI, this.id);
            this.Listen(context.URI);
            const contextReader = new MeldReader(meld);
            const msgs = await contextReader.GetMessages(context.URI);
            messages.push(...msgs);
        }
        return {
            Contexts: contexts,
            Messages: messages,
            URI: '',
            Type: 'local'
        };
    }
}
