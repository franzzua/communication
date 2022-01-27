import {Container} from "@cmmn/core";
import {Authenticator, Issuer, Validator} from "@inhauth/core";
import {RuleStore} from "./rule-store";
import {WithdrawStore} from "./withdraw-store";

export const InhauthContainer = Container.withProviders(
    Issuer,
    {provide: Authenticator, deps: [RuleStore, Validator, Issuer]},
    {provide: Validator, deps: [WithdrawStore]},
    RuleStore,
    WithdrawStore
);