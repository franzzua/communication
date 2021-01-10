import './polyfills';
import {suite, test, timeout, expect} from '@hypertype/tools/test';
import {DomainContainer} from "../domain.container";
import {SolidRepository} from "@infr/solid";
import {SolidLoginMock} from "./mocks/solidLoginMock";
import {StateService} from "@services";
import {Storage} from "@model";
import {utc} from '@hypertype/core';

@suite()
export class SolidRepositorySpec {
    private static container = DomainContainer;
    private static solid = SolidRepositorySpec.container.get<SolidRepository>(SolidRepository);
    private static state = SolidRepositorySpec.container.get<StateService>(StateService);
    private static solidLogin = new SolidLoginMock();
    private static storage: Storage;

    constructor() {
    }

    @timeout(20000)
    static async before() {
        const account = await this.solidLogin.Login();
        this.storage = await this.solid.OnNewAccount(account, true);
    }

    @test()
    async addMessages() {
        const root = () => SolidRepositorySpec.state.State.get(`${SolidRepositorySpec.storage.URI}/root.ttl`);
        const message1 = await SolidRepositorySpec.solid.OnAddMessage({
            id: `${+utc()}`,
            Context: root(),
            Content: '1',
            CreatedAt: utc(),
        });
        const message2 = await SolidRepositorySpec.solid.OnAddMessage({
            id: `${+utc()}`,
            Context: root(),
            Content: '2',
            CreatedAt: utc(),
        });
        const storage = {
            URI: SolidRepositorySpec.storage.URI,
            Root: null
        } as Storage;

        const context = await SolidRepositorySpec.solid.OnCreateContext({
            Storage: SolidRepositorySpec.storage,
            Messages: []
        });
        await SolidRepositorySpec.solid.OnAttachContext(context.URI, message1);
        await SolidRepositorySpec.solid.OnAttachContext(root().URI, message2);
        const message3 = await SolidRepositorySpec.solid.OnAddMessage({
            id: `${+utc()}`,
            Context: context,
            Content: '3',
            CreatedAt: utc(),
        });
        await SolidRepositorySpec.solid.SaveDocs();
        await SolidRepositorySpec.solid.LoadStorage(storage);
        expect(storage.Root.Messages).to.be.lengthOf(2);
        expect(storage.Root.Messages[0].SubContext.Messages).to.be.lengthOf(1);
        expect(storage.Root.Messages[1].SubContext.Messages).to.be.lengthOf(2);
        await SolidRepositorySpec.solid.Unload(storage);

    }

    @timeout(20000)
    static async after() {
        await this.solid.Unload(this.storage);
    }
}