import {ContextJSON, MessageJSON} from "@domain";
import {MeldClone} from "@m-ld/m-ld";

export class MeldWriter {
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
                '@id': message.id,
                id: undefined,
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
                '@id': changes.id,
                Content: '?',
                ContextURI: '?',
                SubContextURI: '?'
            }, {
                '@id': 'writer',
            }],
            '@insert': [{
                '@id': changes.id,
                Content: changes.Content,
                ContextURI: changes.ContextURI,
                SubContextURI: changes.SubContextURI ?? ''
            }, {
                '@id': 'writer',
                value: this.id
            }]
        })
    }

    async DeleteMessage(message: Pick<MessageJSON, "id">) {
        await this.meld.write({
            '@delete': [{
                '@id': message.id,
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