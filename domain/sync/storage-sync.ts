import {Doc, XmlElement} from "yjs";
import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import * as h from "@hypertype/core";
import {Observable, Subject} from "@hypertype/core";
import {ItemSync} from "@domain/sync/item-sync";



export class StorageSync {
    public RemoveContext(context: ContextJSON): Promise<void> {
        return Promise.resolve(undefined);
    }
    public doc = new Doc();
    // private messages = this.doc.getXmlFragment('contexts');
    // private contexts = this.doc.getXmlFragment('messages');

    public Contexts = new ItemSync<ContextJSON>( this.doc.getXmlFragment('contexts'), 'context');
    public Messages = new ItemSync<MessageJSON>( this.doc.getXmlFragment('messages'), 'message');

    public URI: string;
    public Type: string;

    constructor(json: StorageJSON) {
        this.URI = json.URI;
        this.Type = json.Type;
    }


    private Unsubscribe(){

    }


    public Changes$: h.Observable<{ Action, Args }> = h.merge(
        this.Contexts.Changes$.pipe(h.map(x => ({...x, Action: `Context.${x.Action}`}))),
        this.Messages.Changes$.pipe(h.map(x => ({...x, Action: `Context.${x.Action}`}))),
    ).pipe(
        h.shareReplay(1)
    );

    private stateSubject$ = new Subject();

    public State$ = this.Changes$.pipe(
        h.map(() => this.toState()),
        h.shareReplay(1)
    );

    public async AddMessage(message: MessageJSON): Promise<void> {
        this.Messages.Create(message);
    }

    public async Clear(): Promise<void> {
    }

    public async CreateContext(context: ContextJSON): Promise<void> {
        this.Contexts.Create(context);
    }

    public Subscribe(storage: StorageJSON): Promise<void> {
        return Promise.resolve(undefined);
    }

    public async RemoveMessage(msg: MessageJSON): Promise<void> {
        this.Messages.Delete(msg);
    }

    public async UpdateContext(ctx: ContextJSON): Promise<void> {
        this.Contexts.Update(ctx);
    }

    public async UpdateMessage(msg: MessageJSON): Promise<void> {
        this.Messages.Update(msg);
    }

    public toState(): StorageJSON {
        const contexts = this.Contexts.ToJSON();
        const messages = this.Messages.ToJSON();
        return  {
            URI: this.URI,
            Type: this.Type,
            Contexts: contexts,
            Messages: messages
        }
    }

    public OnNewState$: Observable<StorageJSON>;

    public Load(storage: string): Promise<StorageJSON> {
        return Promise.resolve(undefined);
    }
}

class ContextElement{

    static toXmlElement (context: ContextJSON) {
        const element = new XmlElement("context");
        for (let contextKey of Object.getOwnPropertyNames(context)) {
            element.setAttribute(contextKey, context[contextKey]);
        }
        return element;
    }

    static ToJSON(element: XmlElement):  ContextJSON{
        return element.getAttributes() as ContextJSON;
    }
}


class MessageElement{

    static toXmlElement (context: MessageJSON) {
        const element = new XmlElement("message");
        for (let contextKey of Object.getOwnPropertyNames(context)) {
            element.setAttribute(contextKey, context[contextKey]);
        }
        return element;
    }

    static ToJSON(element: XmlElement):  MessageJSON{
        return element.getAttributes() as MessageJSON;
    }
}
