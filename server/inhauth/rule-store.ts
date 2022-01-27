import {AccessInheritanceRule, IRuleStore, URI} from "@inhauth/core";

export class RuleStore implements IRuleStore {

    private rules = new Map<URI, AccessInheritanceRule[]>();

    public async GetRules(resource: URI): Promise<AccessInheritanceRule[]> {
        return this.rules.get(resource) ?? [];
    }

    public async AddRule(uri: URI, rule: AccessInheritanceRule) {
        this.rules.getOrAdd(uri, () => []).push(rule);
    }
}