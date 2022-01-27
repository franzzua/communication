import {AccessMode} from "@inhauth/core";

export class AclStore {
    public async getAcl(resource: string) {
        if (resource.startsWith('fake://')){
            const user = resource.split('/')[2];
            return [{
                user, mode: AccessMode.control,
            }]
        }
        return [{

        }]
    }
}