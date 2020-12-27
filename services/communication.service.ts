import {Communication, Context} from "@model";
import {Injectable} from "@hypertype/core";
import {ContextService} from "./context.service";

@Injectable()
export class CommunicationService {

    constructor(private contextService: ContextService) {
    }

    public async Create(): Promise<Communication> {
        const result = new Communication();
        result.Root = await this.contextService.Create(result);
        return result;
    }

}