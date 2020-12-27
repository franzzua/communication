import {utc} from "@hypertype/core";
import {ContextCollection} from "./data/context.collection";
import {Communication, Context, Message} from "@model";
import {MessageEntity} from "@infr/solid/data/message.entity";
import {ContextDocument} from "@infr/solid/data/context.document";

export class SolidRepository{

    private CommunicationMap = new Map<string, ContextCollection>();
    private ContextMap = new Map<string, ContextDocument>();
    private MessageMap = new Map<string, MessageEntity>();

    public async Load(session){
        const collection = new ContextCollection(session);
        await collection.Init();
        const communication = new Communication();
        const contexts = collection.Contexts.Documents.map(x => {
            const context = new Context();
            context.Communication = communication;
            context.URI = x.URI;
            this.ContextMap.set(context.URI, x);
            return context;
        });
        for (let [contextURI, document] of this.ContextMap) {
            for (const msg of document.Messages.Items) {
                const message = new Message();
                message.CreatedAt = utc(msg.Time);
                message.Context = contexts.find(y => y.URI == msg.Context);
                contexts.find(x => x.URI == contextURI).Messages.push(message);
            }
        }
        return communication;
    }

    async AttachContext(message: Message, context: Context) {
        // const messageEntity = this.MessageMap.get(message.Content);
        // messageEntity.Context = context.URI;
        // messageEntity.Save();
    }

    async AddMessage(message: Message) {
        const contextEntity = this.ContextMap.get(message.Context.URI);
        const messageEntity = contextEntity.Messages.Add();
        messageEntity.Author = message.Author.URI;
        messageEntity.Content = message.Content;
        messageEntity.Time = message.CreatedAt.toJSDate();
        messageEntity.Save();
    }

    async CreateContext(context: Context) {
        const collection = this.CommunicationMap.get(context.Communication.URI);
        const contextEntity = await collection.Contexts.Create();
        this.ContextMap.set(context.URI, contextEntity);
    }
}

