import {MeldFactory} from "@infr/m-ld/meld.factory";
import {MeldClone} from "@m-ld/m-ld";
import {ContextJSON, MessageJSON} from "@domain";

export class ContextStore {
    public constructor(private uri: string, private meld: MeldClone) {
    }

    public static async Factory(uri: string, isNew: boolean | null) {
        const meld = await MeldFactory.GetMeldClone(uri, isNew);
        return new ContextStore(uri, meld);
    }

    public async AddMessage(message: MessageJSON) {
        await this.meld.write({
            '@insert': {
                ...message,
                SubContextURI: message.SubContextURI ?? '',
                '@id': message.URI,
                '@type': 'message'
            },
        });
    }

    async UpdateMessage(changes: Partial<MessageJSON>) {
        await this.meld.write({
            '@delete': {
                '@id': changes.URI,
                Content: '?',
                SubContextURI: '?'
            },
            '@insert': {
                '@id': changes.URI,
                Content: changes.Content,
                SubContextURI: changes.SubContextURI ?? ''
            }
        })
    }

    async DeleteMessage(message: MessageJSON) {
        await this.meld.write({
            '@delete': {
                '@id': message.URI,
                "?prop": "?value"
            }
        })
    }

    async GetMessages(): Promise<ReadonlyArray<MessageJSON>> {
        const messageEntities = await this.meld.read({
            "@describe": "?id",
            "@where": {
                "@id": "?id",
                '@type': 'message',
                'ContextURI': this.uri
            }
        });
        const messages = [...messageEntities.values()].map(x => ({
            ...x as any
        } as MessageJSON));
        console.log(messages);
        return messages;
    }
}