import {suite, test} from "@testdeck/jest";
import {TokenCryptorBase} from "@infr/yjs/token-cryptor";
import {AsIsCryptor} from "@infr/yjs/yWebRtc/as-is-cryptor";
import {expect} from "@jest/globals";

@suite()
export class TokenCryptorSpec {

    private token = "blacblacblac";
    private tokenCryptor = new TokenCryptorBase(this.token, new AsIsCryptor());

    @test()
    public async forwardBackward() {
        const buffer = Buffer.from([1, 2, 3, 4, 5]);
        const encrypted = await this.tokenCryptor.encrypt(buffer)
        const {token, result} = await this.tokenCryptor.decrypt(encrypted);
        expect(token).toBe(this.token);
        expect([...new Uint8Array(result)]).toStrictEqual([1, 2, 3, 4, 5])
    }
}