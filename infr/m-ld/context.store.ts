import {MeldFactory} from "@infr/m-ld/meld.factory";
import {MeldClone} from "@m-ld/m-ld";
import {ContextJSON, MessageJSON} from "@domain";

export class ContextStore {
    private constructor(private uri: string, private meld: MeldClone) {
    }

    public static async Factory(uri: string, isNew: boolean | null) {
        const meld = await MeldFactory.GetMeldClone(uri, isNew);
        return new ContextStore(uri, meld);
    }

    public async AddMessage(message: MessageJSON) {
        await this.meld.write({
            '@insert': {
                ...message,
                '@id': message.URI
            },
        });
    }

    async UpdateMessage(changes: Partial<MessageJSON>) {
        await this.meld.write({
            '@delete': {
                Content: '?'
            },
            '@insert': {
                Content: changes.Content
            },
            '@where': {
                '@id': changes.URI
            }
        })
    }

    async DeleteMessage(message: MessageJSON) {

    }

    async GetMessages(): Promise<MessageJSON[]> {
        const messageEntities = await this.meld.read({
            "@describe": "?id",
            "@where": {
                "@id": "?id"
            }
        });
        const messages = [...messageEntities.values()].map(x => ({
            ...x as any
        } as MessageJSON));
        return messages;
    }
}