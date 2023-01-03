import {TreeComponent} from "./tree/tree.component";
import {TreeReducers} from "./tree/tree-reducers";
import {MobileToolbarComponent} from "./mobile-toolbar/mobile-toolbar.component";
import {Container} from "@cmmn/core";
import { ContentEditableComponent } from "./content-editable/content-editable.component";
import {TextContentComponent} from "./content/text-content.component";

export const UIContainer = Container.withProviders(
    TreeComponent,
    TreeReducers,
    TextContentComponent,
    MobileToolbarComponent,
    ContentEditableComponent,
);

