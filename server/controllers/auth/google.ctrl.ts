import {controller, Get} from "@cmmn/server";
import {FastifyReply, FastifyRequest} from "fastify";
import fetch from "node-fetch";
import * as fs from "fs";
import {domain, rootDir} from "../../const";

const config = {} as any;//JSON.parse(fs.readFileSync(`${rootDir}/credentials/google.app.json`, 'utf8'));

@controller("/api/auth/google")
export class GoogleCtrl{
    private redirectUrl = `https://${domain}/api/auth/google/onsuccess`;
    private scopes = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]
    @Get("url")
    getRedirectUrl(request: FastifyRequest<{
        Querystring: {
            redirect: string;
        }
    }>){
        const url = `https://accounts.google.com/o/oauth2/v2/auth`;
        const query = new URLSearchParams({
            scope: this.scopes.join(' '),
            access_type: 'offline',
            include_granted_scopes: 'true',
            response_type: 'code',
            state: request.query.redirect,
            redirect_uri: this.redirectUrl,
            client_id: config.web.client_id,
        });
        return url + '?' + query.toString();
    }


    @Get("onsuccess")
    async onSuccess(request: FastifyRequest<{
        Querystring: {
            code: string;
            state: string;
            scope: string;
        }
    }>, reply: FastifyReply) {
        const url = 'https://oauth2.googleapis.com/token?' +
            new URLSearchParams({
                code: request.query.code,
                client_id: config.web.client_id,
                client_secret: config.web.client_secret,
                redirect_uri: this.redirectUrl,
                grant_type: 'authorization_code'
            }).toString();
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(x => x.json() as Promise<{
            access_token: string;
            expires_in: number;
            scope: string;
            token_type: 'Bearer';
        }>);
        console.log(res);
        reply.setCookie('jwt:google', res.access_token, {
            expires: new Date(+new Date()+res.expires_in*1000*100),
            httpOnly: false,
            path: '/',
            secure: false,
            signed: false
        })
        reply.redirect(request.query.state ?? `https://${domain}`);
    }
}