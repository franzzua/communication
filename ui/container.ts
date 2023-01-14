import {TreeComponent} from "./tree/tree.component";
import {TreeReducers} from "./tree/tree-reducers";
import {MobileToolbarComponent} from "./mobile-toolbar/mobile-toolbar.component";
import {Container} from "@cmmn/core";
import {TextContentComponent} from "./content/text-content.component";
import {EditorComponent} from "./editor/editor.component";
import {EditorControls} from "./editor/controls/editor-controls";

export const UIContainer = Container.withProviders(
    TreeComponent,
    TreeReducers,
    TextContentComponent,
    MobileToolbarComponent,
    EditorComponent,
    EditorControls
);

