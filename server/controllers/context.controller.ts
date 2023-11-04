import {Injectable} from "@cmmn/core";
import {controller, Get, Post} from "@cmmn/server";
import {FastifyReply, FastifyRequest} from "fastify";
import {AccessMode, Issuer, ResourceToken} from "@inhauth/core";
import {RuleStore} from "../inhauth/index";
import {TokenParser} from "../services/token.parser";
import {Authorizer} from "../services/authorizer.service";

@Injectable()
@controller('/api/context')
export class ContextController {

    constructor(private authorizer: Authorizer,
                private parser: TokenParser,
                private ruleStore: RuleStore,
                private issuer: Issuer) {
    }

    @Get()
    async getTokens(request: FastifyRequest, reply: FastifyReply) {
        const uri = request.query['uri'];
        const token = await this.parser.Parse<ResourceToken>(request.headers['ResourceToken'] && request.headers['ResourceToken'][0]);
        const accessToken = JSON.parse(request.headers.authorization);
        const resultToken = await this.authorizer.Authorize({uri, token, user: accessToken?.user});
        reply.headers({
            'ResourceToken': await this.parser.stringify(resultToken)
        });
        reply.code(204);
    }

    @Post()
    async addInheritance(request: FastifyRequest, reply: FastifyReply) {
        const from = request.query["from"];
        const to = request.query["to"];
        await this.ruleStore.AddRule(to, {
            InheritedFrom: from,
            AccessMode: AccessMode.read
        });
    }
}