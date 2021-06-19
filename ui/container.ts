import {Container} from "@hypertype/core";
import {ContextComponent} from "./context/context.component";
import {KeyboardHandler} from "./handlers/keyboard.handler";
import {MessageComponent} from "./message/message.component";
import {TextContentComponent} from "./content/text-content.component";
import { StateLogger } from "@hypertype/infr";
import {ManagementComponent} from "./management/management.component";
import {StorageComponent} from "./storage/storage.component";
import {AddStorageComponent} from "./add-storage/add-storage.component";
import {TreeComponent} from "./tree/tree.component";
import {TreeStore} from "./tree/tree-store.service";
import {MobileToolbarComponent} from "./mobile-toolbar/mobile-toolbar.component";
import {StateService} from "@services";
import {SparqlComponent} from "./sparql/sparql.component";

export const UIContainer = Container.withProviders(
    ContextComponent,
    SparqlComponent,
    MessageComponent,
    StorageComponent,
    TextContentComponent,
    KeyboardHandler,
    AddStorageComponent,
    StateLogger,
    ManagementComponent,
    TreeComponent,
    StateService,
    TreeStore,
    MobileToolbarComponent
);

