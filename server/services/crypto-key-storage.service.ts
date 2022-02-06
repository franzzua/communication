import {Injectable} from "@cmmn/core";
import {promises} from "fs";
import {exportPKCS8,exportSPKI,  importSPKI, generateKeyPair,CompactEncrypt, GenerateKeyPairResult, importPKCS8, KeyLike} from "jose";

const {writeFile, readFile, stat} = promises;

@Injectable()
export class CryptoKeyStorage {

    public alg = 'ES512';

    private privateKeyPath = './private.key';
    private publicKeyPath = './public.key';

    private key: Promise<GenerateKeyPairResult> = this.getKeyPair();

    private privateKey = this.key.then(x => x.privateKey);
    private publicKey = this.key.then(x => x.publicKey);

    protected async saveKey(pair: GenerateKeyPairResult) {
        const privateKey = await exportPKCS8(pair.privateKey);
        const publicKey = await exportSPKI(pair.publicKey);
        await Promise.all([
            writeFile(this.privateKeyPath, privateKey, "utf8"),
            writeFile(this.publicKeyPath, publicKey, "utf8"),
        ]);
    }

    protected async readKey(): Promise<GenerateKeyPairResult | null> {
        if (!await Promise.all([
            stat(this.privateKeyPath).catch(e => null),
            stat(this.publicKeyPath).catch(e => null)
        ]).then(([a, b]) => a && b))
            return null;
        const [privateKey, publicKey] = await Promise.all([
            readFile(this.privateKeyPath, "utf8").then(x => importPKCS8(x, this.alg)),
            readFile(this.publicKeyPath, "utf8").then(x => importSPKI(x, this.alg)),
        ]);
        return {
            privateKey, publicKey
        }
    }

    private async getKeyPair() {
        const existed = await this.readKey();
        if (existed)
            return existed;
        const generated = await generateKeyPair(this.alg);
        await this.saveKey(generated);
        return generated;
    }

    public getPublicKey() {
        return this.publicKey;
    }
    public getPublicKeyString() {
        return this.publicKey.then(exportSPKI)
    }

    public getPrivateKey() {
        return this.privateKey;
    }
}