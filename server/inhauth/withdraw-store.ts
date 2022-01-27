import {IWithdrawStore, URI} from "@inhauth/core";

export class WithdrawStore implements IWithdrawStore {
    public async CheckIfWithdrawed(resource: URI, since?: Date): Promise<boolean> {
        return false;
    }

    public async WithdrawAllTokens(resource: URI): Promise<void> {
        return Promise.resolve(undefined);
    }

}