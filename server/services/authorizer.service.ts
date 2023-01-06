import {Injectable} from "@cmmn/core";
import {AccessMode, Authenticator, ResourceToken} from "@inhauth/core";
import {AclStore} from "./acl.store";

@Injectable()
export class Authorizer {
    constructor(private inhauth: Authenticator, private aclStore: AclStore) {
    }

    public async Authorize(data: {
        uri: string,
        user?: string,
        token?: ResourceToken
    }): Promise<any | null> {
        if (data.user) {
            const acl = this.aclStore.getAcl(data.uri);
            return {
                URI: data.uri,
                ResourcePath: [],
                IssueDate: new Date(),
                Expires: new Date(+new Date() + 1000 * 60 * 60 * 24),
                User: data.user,
                AccessMode: AccessMode.control
            }
        }
        if (data.token) {
            return this.inhauth.Authenticate(data.uri, data.token).catch();
        }
    }
}