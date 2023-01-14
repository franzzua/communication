import {suite, test} from "@testdeck/jest";
import { CryptoKeyStorage } from "../../server/services/crypto-key-storage.service";
import {TokenParser} from "../../server/services/token.parser";
import {AccessMode} from "@inhauth/core";
import {expect} from "@jest/globals";

@suite
export class TokenSpec{
    private parser = new TokenParser(new CryptoKeyStorage());

    @test
    async signVerify(){
        const token = {
            URI: 'test uri',
            ResourcePath: [],
            IssueDate: new Date(),
            Expires: new Date(+new Date() + 1000 * 60 * 60 * 24),
            User: 'testuser',
            AccessMode: AccessMode.control
        };
        const str = await this.parser.stringify(token)
        const parsed = await this.parser.Parse<any>(str);
        expect(parsed.URI).toEqual(token.URI)
    }
}