import {TokenParser} from "../server/services/token.parser";
import {suite, test} from "@testdeck/jest";
import {ServerMockContainer} from "./container";
import {expect} from "@jest/globals";

@suite()
class TokenSpec {
    private parser: TokenParser = ServerMockContainer.get(TokenParser);
    constructor() {
    }
    //
    async getToken() {
        const token = await this.parser.stringify({
            URI: 'asd',
            AccessMode: 1
        } as any);
        return token;
    }

    @test()
    async parseToken() {
        const token = await this.getToken();
        const rsToken = await this.parser.Parse<{ URI }>(token);
        expect(rsToken.URI).toBe('asd');
    }
}

