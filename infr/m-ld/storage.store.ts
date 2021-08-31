import {MeldFactory} from "@infr/m-ld/meld.factory";
import {MeldClone} from "@m-ld/m-ld";
import {ContextJSON, StorageJSON} from "@domain";

export class StorageStore {
    public constructor(public URI: string, private meld: MeldClone) {
    }

    public static async Factory(uri: string, isNew: boolean | null) {
        const meld = await MeldFactory.GetMeldClone(uri, isNew);
        return new StorageStore(uri, meld);
    }

    public async AddMessage(text) {
        try {
            await this.meld.write({
                '@insert': {}
            });
        } catch (e) {
            console.error(e);
        }
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
            console.log(contexts);
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
                    IsRoot: context.IsRoot
                }
            });
        }catch (e){
            console.error(e);
        }
    }

    async UpdateContext(changes: Partial<ContextJSON>) {

    }
}