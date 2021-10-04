import {ContextJSON, MessageJSON} from "@domain";
import {MeldClone, MeldReadState} from "@m-ld/m-ld";

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
            ...x as any
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

export class MeldStore {
    public constructor(private meld: MeldClone, private id: string) {
    }


    async CreateContext(context: ContextJSON) {
        try {
            await this.meld.write({
                '@delete': [{
                    '@id': 'writer'
                }],
                '@insert': [{
                    '@id': context.URI,
                    '@type': 'context',
                    CreatedAt: context.CreatedAt,
                    IsRoot: context.IsRoot,
                    Permutation: context.Permutation ?? '[]'
                }, {
                    '@id': 'writer',
                    value: this.id
                }]
            });
        } catch (e) {
            console.error(e);
        }
    }

    async UpdateContext(changes: Partial<ContextJSON>) {

        try {
            await this.meld.write({
                '@delete': [{
                    '@id': changes.URI,
                    CreatedAt: '?',
                    IsRoot: '?',
                    Permutation: '?',
                }, {
                    '@id': 'writer'
                }],
                '@insert': [{
                    '@id': changes.URI,
                    CreatedAt: changes.CreatedAt,
                    IsRoot: changes.IsRoot,
                    Permutation: changes.Permutation,
                }, {
                    '@id': 'writer',
                    value: this.id
                }]
            });
        } catch (e) {
            console.error(e);
        }
    }


    public async AddMessage(message: MessageJSON) {
        await this.meld.write({
            '@delete': [{
                '@id': 'writer'
            }],
            '@insert': [{
                ...message,
                SubContextURI: message.SubContextURI ?? '',
                '@id': message.URI,
                '@type': 'message'
            }, {
                '@id': 'writer',
                value: this.id
            }]
        });
    }

    async UpdateMessage(changes: Partial<MessageJSON>) {
        await this.meld.write({
            '@delete': [{
                '@id': changes.URI,
                Content: '?',
                SubContextURI: '?'
            }, {
                '@id': 'writer',
            }],
            '@insert': [{
                '@id': changes.URI,
                Content: changes.Content,
                SubContextURI: changes.SubContextURI ?? ''
            }, {
                '@id': 'writer',
                value: this.id
            }]
        })
    }

    async DeleteMessage(message: MessageJSON) {
        await this.meld.write({
            '@delete': [{
                '@id': message.URI,
                "?prop": "?value"
            }, {
                '@id': 'writer',
            }],
            '@insert': {
                '@id': 'writer',
                value: this.id
            }
        })
    }

}