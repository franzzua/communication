import {MeldReadState} from "@m-ld/m-ld";
import {ContextJSON, MessageJSON} from "@domain";

export class MeldReader {
    public constructor(private state: MeldReadState) {
    }


    async GetMessages(uri: string): Promise<ReadonlyArray<MessageJSON>> {
        const messageEntities = await this.state.read({
            "@describe": "?id",
            "@where": {
                "@id": "?id",
                '@type': 'message',
                'ContextURI': uri
            }
        });
        const messages = [...messageEntities.values()].map(x => ({
            ...x as any,
            id: x['@id']
        } as MessageJSON));
        return messages;
    }

    async GetContexts(): Promise<ContextJSON[]> {
        try {
            const contextEntities = await this.state.read({
                "@describe": "?id",
                "@where": {
                    "@id": "?id",
                    '@type': 'context',
                }
            });
            const contexts = [...contextEntities.values()].map((x: any) => ({
                ...x,
                '@id': undefined,
                URI: x['@id']
            } as ContextJSON));
            return contexts;
        } catch (e) {
            console.error(e);
            return [];
        }
    }
}