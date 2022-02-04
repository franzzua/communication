import {CryptoKeyStorage} from "../server/services/crypto-key-storage.service";

export class CryptoKeyStorageMock extends CryptoKeyStorage {
    protected async readKey() {
        return null;
    }

    protected async saveKey() {
        return null;
    }
}