import {MeldClone} from "@m-ld/m-ld";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain";

export class MeldStore {
    public constructor(public URI: string, private meld: MeldClone) {
    }

    async GetContexts(): Promise<ContextJSON[]> {
        try {
            const contextEntities = await this.meld.read({
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
        }catch (e){
            console.error(e);
            return [];
        }
    }

    async CreateContext(context: ContextJSON) {
        try {
            await this.meld.write({
                '@insert': {
                    '@id': context.URI,
                    '@type': 'context',
                    CreatedAt: context.CreatedAt,
                    IsRoot: context.IsRoot,
                    Permutation: context.Permutation ?? '[]'
                }
            });
        }catch (e){
            console.error(e);
        }
    }

    async UpdateContext(changes: Partial<ContextJSON>) {

        try {
            await this.meld.write({
                '@delete': {
                    '@id': changes.URI,
                    CreatedAt: '?',
                    IsRoot: '?',
                    Permutation: '?',
                },
                '@insert': {
                    '@id': changes.URI,
                    CreatedAt: changes.CreatedAt,
                    IsRoot: changes.IsRoot,
                    Permutation: changes.Permutation,
                }
            });
        }catch (e){
            console.error(e);
        }
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

    async GetMessages(uri: string): Promise<ReadonlyArray<MessageJSON>> {
        const messageEntities = await this.meld.read({
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
}