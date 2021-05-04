import {Doc, XmlElement} from "yjs";
import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import * as h from "@hypertype/core";
import {Subject} from "@hypertype/core";
import {ItemSync} from "@domain/sync/item-sync";



export class StorageSync implements IRepository{
    public doc = new Doc();
    // private messages = this.doc.getXmlFragment('contexts');
    // private contexts = this.doc.getXmlFragment('messages');

    public contexts = new ItemSync<ContextJSON>( this.doc.getXmlFragment('contexts'), 'context');
    public messages = new ItemSync<MessageJSON>( this.doc.getXmlFragment('messages'), 'message');

    public URI: string;
    public Type: string;

    constructor(json: StorageJSON) {
        this.URI = json.URI;
        this.Type = json.Type;
    }


    private Unsubscribe(){

    }


    public Changes$: h.Observable<{ Action, Args }> = h.merge(
        this.contexts.Changes$.pipe(h.map(x => ({...x, Action: `Context.${x.Action}`}))),
        this.messages.Changes$.pipe(h.map(x => ({...x, Action: `Context.${x.Action}`}))),
    ).pipe(
        h.shareReplay(1)
    );

    private stateSubject$ = new Subject();

    public State$ = this.Changes$.pipe(
        h.map(() => this.toState()),
        h.shareReplay(1)
    );

    public async AddMessage(message: MessageJSON): Promise<MessageJSON> {
        this.messages.Create(message);
        return message;
    }

    public async Clear(): Promise<void> {
    }

    public async CreateContext(context: ContextJSON): Promise<ContextJSON> {
        this.contexts.Create(context);
        return context;
    }

    public Init(storage: StorageJSON): Promise<StorageJSON> {
        return Promise.resolve(undefined);
    }

    public async RemoveMessage(msg: MessageJSON): Promise<void> {
        this.messages.Delete(msg.id);
    }

    public async UpdateContext(ctx: ContextJSON): Promise<void> {
        this.contexts.Update(ctx.id, ctx);
    }

    public async UpdateMessage(msg: MessageJSON): Promise<void> {
        this.messages.Update(msg.id, msg);
    }

    public toState(): StorageJSON {
        const contexts = this.contexts.ToJSON();
        const messages = this.messages.ToJSON();
        return  {
            URI: this.URI,
            Type: this.Type,
            Contexts: contexts,
            Messages: messages
        }
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
