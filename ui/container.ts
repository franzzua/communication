import {Container} from "@hypertype/core";
import {ContextComponent} from "./context/context.component";
import {KeyboardHandler} from "./handlers/keyboard.handler";
import {MessageComponent} from "./message/message.component";
import {TextContentComponent} from "./message/text-content.component";
import {CommunicationComponent} from "./communication/communication.component";

export const UIContainer = Container.withProviders(
    ContextComponent,
    MessageComponent,
    CommunicationComponent,
    TextContentComponent,
    KeyboardHandler
);

