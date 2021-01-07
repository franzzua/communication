import {Context, Message} from "@model";
import {ContentType, Doc, XmlElement} from "yjs";
import {utc} from "@hypertype/core";
import {EventBus} from "../../services";
import {WebrtcProvider} from "y-webrtc";

export class ContextSync {

    protected Connect(room: string, doc: Doc) {
        return new WebrtcProvider(room, doc, {
            signaling: [
                'ws://localhost:3000'
            ]
        } as any);
    }

    public Doc = new Doc();
    private Provider = this.Connect(this.uri, this.Doc);
    private Fragment = this.Doc.getXmlFragment('main');
    private MessageMap = new Map<string, XmlElement>();
    private MessageBackMap = new Map<string, Message>();
    private context: Context;

    public EventBus = new EventBus();

    constructor(private uri: string) {
        console.log('start sync', uri);
        this.Fragment.observeDeep((events, transaction) => {
            for (let event of events) {
                // @ts-ignore
                // console.log(event.transaction.local ? 'local': 'another', this.stateService.logService.Instance);

                if (event.transaction.local)
                    continue;
                console.log('event', event);
                for (let added of event.changes.added) {
                    const element = ((added.content as ContentType).type as XmlElement);
                    switch (element.nodeName) {
                        case 'context':
                            this.onNewContext(element);
                            break;
                        case 'message':

                            this.onNewMessage(element);
                            break;
                    }
                }
                for (let added of event.changes.deleted) {
                    const element = ((added.content as ContentType).type as XmlElement);
                    // @ts-ignore // TODO: fix getAttribute()
                    const id = element._map.get("id").content.arr[0];
                    const existed = this.MessageBackMap.get(id);
                    if (!existed) {
                        console.warn('remove failed', element);
                        return;
                    }
                    switch (element.nodeName) {
                        case 'message':
                            this.EventBus.Notificator.OnDeleteMessage(existed);
                            break;
                    }
                }
                for (let [key, change] of event.changes.keys) {
                    const element = event.target as XmlElement;
                    console.log('update', element);
                    const existed = this.MessageBackMap.get(element.getAttribute('id'));
                    if (!existed) {
                        console.warn('update failed', element);
                        return;
                    }
                    switch (key) {
                        case 'content':
                            const content = element.getAttribute('content');
                            this.EventBus.Notificator.OnUpdateContent(existed, content);
                    }
                }
            }
        });
    }
    //
    private onNewContext(element: XmlElement) {
        console.log('new context from yjs ');
        const context = {
            URI: element.getAttribute('uri'),
            Messages: []
        };
        // console.log(added, context);
        this.context = context;
        this.EventBus.Notificator.OnCreateContext(context);
        if (element.firstChild != null) {
            element.querySelectorAll('message').forEach(messageElement => {
                this.onNewMessage(messageElement as XmlElement);
            });
        }
    }

    private onNewMessage(element: XmlElement) {
        console.log('new message from yjs');
        const createdAt = element.getAttribute('createdAt');
        const message = {
            CreatedAt: utc(createdAt),
            Content: element.getAttribute('content'),
            Context: this.context,
            URI: element.getAttribute('uri'),
            id: element.getAttribute('id')
        } as Message;
        this.MessageMap.set(message.id, element);
        this.MessageBackMap.set(message.id, message);
        // console.log(added, context);
        this.EventBus.Notificator.OnAddMessage(message);
    }

    AddContext(context: Context) {
        const contextElement = new XmlElement('context');
        this.Doc.transact(() => {
            contextElement.setAttribute('uri', context.URI);
            this.Fragment.insert(0, [contextElement]);
        });
        this.context = context;
    }

    AddMessage(message: Message) {
        if (!message.URI && !message.id){
            message.id = `${+utc()}.${this.Doc.clientID}`;
        }
        if (this.MessageMap.has(message.id))
            return;
        const newElement = new XmlElement('message');
        this.Doc.transact(() => {
            newElement.setAttribute('createdAt', message.CreatedAt.toISO());
            newElement.setAttribute('content', message.Content);
            newElement.setAttribute('uri', message.URI);
            newElement.setAttribute('id', message.id);
            this.Fragment.push([newElement]);
        });
        this.MessageMap.set(message.id, newElement);
        this.MessageBackMap.set(message.id, message);
    }


    UpdateContent(message: Message, content: any) {
        const element = this.MessageMap.get(message.id);
        this.Doc.transact(() => {
            element.setAttribute('content', content);
        });
    }

    private isMaster = false;

    Load(context: Context) {
        this.isMaster = true;
        this.Doc.transact(() => {
            if (!this.Fragment.firstChild){
                this.AddContext(context);
            }
            for (let message of context.Messages) {
                if (this.MessageMap.has(message.URI))
                    continue;
                this.AddMessage(message);
            }
        })
    }

    public get IsMaster() {
        return this.isMaster;
    }

    DeleteMessage(message: Message) {
        const element = this.MessageMap.get(message.id);
        this.Doc.transact(() => {
            for (let index = 0; index < this.Fragment.length; index++){
                if (this.Fragment.get(index) == element){
                    this.Fragment.delete(index);
                    return;
                }
            }
        });
    }
}