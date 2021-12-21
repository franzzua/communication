import '../polyfills';
import { suite, test, expect } from '@hypertype/tools/test';
import {StorageSync} from "@domain/sync/storage-sync";
import {ContextJSON, MessageJSON} from "@domain";
import {SyncBus} from "@domain/sync/sync-bus";

@suite()
export class SyncSpec{
    private sync1: StorageSync;
    private sync2: StorageSync;
    private syncBus = new SyncBus();
    private storageURI = 'local://default';

    constructor() {
    }

    async before(){
        this.sync1 = new StorageSync({
            URI: this.storageURI,
            Type: 'test',
            Messages: [],
            Contexts: []
        });
        this.sync2 = new StorageSync({
            URI: this.storageURI,
            Type: 'test',
            Messages: [],
            Contexts: []
        });
        this.syncBus.connect(this.sync1.URI, this.sync1.doc);
        this.syncBus.connect(this.sync2.URI, this.sync2.doc);
        // this.syncBus.connect(this.sync2.URI, ydoc);
        // await indexeddbProvider.whenSynced;
        this.sync2.Changes$.subscribe(console.log);
    }

    @test()

    async AddMessage(){
        const msg: MessageJSON = {
            Content: 'Hyppo Hello',
            StorageURI: this.storageURI,
            id: '123',
            id: '1',
        };
        this.sync1.Messages.Create(msg);
        await this.syncBus.isUpdating$;
        const state = this.sync2.toState();
        expect(state.Messages[0]).deep.equal(msg);
        msg.Content = 'Goodbuy hippo!';
        this.sync1.Messages.Update(msg.id, {Content: msg.Content});
        await this.syncBus.isUpdating$;
        const state2 = this.sync2.toState();
        expect(state2.Messages[0]).deep.equal(msg);
    }
    @test()
    async AddContext(){
        const ctx: ContextJSON = {
            id: '1',
            StorageURI: this.storageURI,
            URI: '123',
            MessageURIs: [],
            ParentsURIs: []
        };
        this.sync1.Contexts.Create(ctx);
        await this.syncBus.isUpdating$;
        const state = this.sync2.toState();
        expect(state.Contexts[0]).deep.equal(ctx);
    }
}
