
import {Container} from "@cmmn/core";
import {ServerContainer} from "../server/container";
import {CryptoKeyStorageMock} from "./crypto-key-storage-mock";
import {CryptoKeyStorage} from "../server/services/crypto-key-storage.service";
import {TokenParser} from "../server/services/token.parser";

export const ServerMockContainer = Container.withProviders(
    ...ServerContainer.getProviders(),
    {provide: CryptoKeyStorage, useClass: CryptoKeyStorageMock}
)