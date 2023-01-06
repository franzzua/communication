import {Injectable} from "@cmmn/core";
import {controller, Get} from "@cmmn/server";
import {CryptoKeyStorage} from "../services/crypto-key-storage.service";

@Injectable()
@controller('/api/public-key')
export class PublicKeyController{
    constructor(private keyStorage: CryptoKeyStorage) {

    }

    @Get()
    public async getPublicKey(){
        return  await this.keyStorage.getPublicKeyString();
    }
}