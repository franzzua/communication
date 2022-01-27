import {Injectable} from "@cmmn/core";

@Injectable()
export class TokenParser {

    public async Parse<TokenType>(token: string): Promise<TokenType | null> {
        if (!token) return null;
        return JSON.parse(token) as TokenType;
    }
}