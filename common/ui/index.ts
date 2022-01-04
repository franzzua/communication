import {component, GlobalStaticState} from "./component";
import {HtmlComponent} from "./htmlComponent";
import {Container} from "@common/core";
import "./styleHandler"

export {HtmlComponent, component};

export function setDefaultContainer(container: Container) {
    GlobalStaticState.DefaultContainer = container;
}

export * from "./types";
export {property} from "./property";