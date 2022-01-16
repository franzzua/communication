import {TreeComponent} from "./tree/tree.component";
import {TreeReducers} from "./tree/tree-reducers";
import {MobileToolbarComponent} from "./mobile-toolbar/mobile-toolbar.component";
import {Container} from "@common/core";

export const UIContainer = Container.withProviders(
    TreeComponent,
    TreeReducers,
    MobileToolbarComponent
);

