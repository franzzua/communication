import {Collection, collection, DocumentSet, documentSet, ISession} from "solidocity";
import {Injectable} from "@hypertype/core";
import {ContextDocument} from "@infr/solid/data/context.document";

@collection()
@Injectable()
export class ContextCollection extends Collection {

    @documentSet(ContextDocument)
    public Contexts: DocumentSet<ContextDocument>;
}