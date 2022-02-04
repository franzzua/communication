import {Container} from "@cmmn/core";
import {TokenParser} from "./services/token.parser";
import {Authorizer} from "./services/authorizer.service";
import {AclStore} from "./services/acl.store";
import {CryptoKeyStorage} from "./services/crypto-key-storage.service";

export const ServerContainer = Container.withProviders(
    TokenParser, Authorizer, AclStore, CryptoKeyStorage
);