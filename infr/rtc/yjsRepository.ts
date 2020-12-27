import {ContentType, Doc, XmlElement, XmlFragment} from "yjs";
import {WebrtcProvider} from 'y-webrtc/src/y-webrtc.js';
import {Context, Message} from "@model";
import {NotifyDelegate} from "@services";
import {utc} from "@hypertype/core";

export class YjsRepository {
    private yDoc = new Doc();
    private fragment: XmlFragment;
    private ContextMap = new Map<string, { XmlElement: XmlElement; Context: Context }>();
    private MessageMap = new Map<Message, XmlElement>();

    constructor(private notify: NotifyDelegate) {
        const provider = new WebrtcProvider('some-room', this.yDoc, {
            signaling: [
                'ws://localhost:4444'
            ]
        } as any);
        provider.connect();
        this.fragment = this.yDoc.getXmlFragment('root');
        this.yDoc.on('update', (update, origin) => {
            // console.log(encodeStateAsUpdate(this.yDoc, update));
            // applyUpdate(this.yDoc, update);
        })
        this.fragment.observeDeep((events, transaction) => {
            console.log(this.fragment.toJSON());
            for (let event of events) {
                if (event.transaction.local)
                    continue;
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
                for (let [key, change] of event.changes.keys) {
                    const element = event.target as XmlElement;
                    const existed = Array.from(this.MessageMap).find(([message, x]) => x == element)[0];
                    switch (key) {
                        case 'content':
                            this.notify('UpdateContent', {
                                Message: existed,
                                Content: element.getAttribute('content')
                            });
                    }
                }
            }
        })
    }

    private onNewContext(element: XmlElement) {
        console.log('new context');
        const context = {
            URI: element.getAttribute('uri'),
            Messages: []
        };
        this.ContextMap.set(context.URI, {Context: context, XmlElement: element});
        // console.log(added, context);
        this.notify('CreateContext', {
            Context: context
        });
        if (element.firstChild != null) {
            element.querySelectorAll('message').forEach(messageElement => {
                this.onNewMessage(messageElement as XmlElement);
            });
        }
    }

    private onNewMessage(element: XmlElement) {
        console.log('new message');
        const contextURI = (element.parent as XmlElement).getAttribute('uri');
        const context = this.ContextMap.get(contextURI).Context;

        const message = {
            CreatedAt: utc(element.getAttribute('createdAt')),
            Content: element.getAttribute('content'),
            Context: context
        } as Message;
        this.MessageMap.set(message, element);
        // console.log(added, context);
        this.notify('AddMessage', {
            Message: message
        });
    }

    async AttachContext(message: Message, context: Context) {
    }

    async AddMessage(message: Message) {
        const element = this.ContextMap.get(message.Context.URI).XmlElement;
        const newElement = new XmlElement('message');
        this.yDoc.transact(() => {
            newElement.setAttribute('createdAt', message.CreatedAt.toISO());
            newElement.setAttribute('content', message.Content);
            element.insert(0, [newElement]);
        });
        this.MessageMap.set(message, newElement);
    }

    async CreateContext(context: Context) {
        const element = new XmlElement('context');
        this.yDoc.transact(() => {
            element.setAttribute('uri', context.URI);
            this.fragment.insert(0, [element]);
        });
        this.ContextMap.set(context.URI, {Context: context, XmlElement: element});
    }

    async UpdateContent(message: Message, content: any) {
        const element = this.MessageMap.get(message);
        this.yDoc.transact(() => {
            element.setAttribute('content', content);
        });
    }
}