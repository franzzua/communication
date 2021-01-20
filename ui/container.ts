import {Container} from "@hypertype/core";
import {ContextComponent} from "./context/context.component";
import {KeyboardHandler} from "./handlers/keyboard.handler";
import {MessageComponent} from "./message/message.component";
import {TextContentComponent} from "./message/text-content.component";
import {ContextStore} from "../stores/context/context.store";
import { StateLogger } from "@hypertype/infr";
import {ManagementComponent} from "./management/management.component";
import {StorageComponent} from "./storage/storage.component";
import {AddStorageComponent} from "./add-storage/add-storage.component";
import {TreeComponent} from "./tree/tree.component";
import {TreeKeyboardReducer} from "./tree/tree.keyboard.reducer";

export const UIContainer = Container.withProviders(
    ContextComponent,
    MessageComponent,
    StorageComponent,
    TextContentComponent,
    KeyboardHandler,
    ContextStore,
    AddStorageComponent,
    StateLogger,
    ManagementComponent,
    TreeComponent,
    TreeKeyboardReducer,
);

