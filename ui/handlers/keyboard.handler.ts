import {fromEvent, Injectable, merge, tap} from "@hypertype/core";
import {ContextService, MessageService} from "@services";

@Injectable()
export class KeyboardHandler {
    // private copy: Context;
    constructor(
        private contextService: ContextService,
        private messageService: MessageService,
        private cursor: any
        // private hierarchy: HierarchyService,
        // private tree: ContextTree,
        // private cursor: CursorService
    ) {

    }

    private async Action(event: KeyboardEvent){
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                // if (event.shiftKey && event.ctrlKey)
                //     this.hierarchy.MoveUp();
                if (event.ctrlKey)
                    this.cursor.Up();
                break;
            case 'ArrowDown':
                event.preventDefault();
                // if (event.shiftKey && event.ctrlKey)
                //     this.hierarchy.MoveDown();
                if (event.ctrlKey)
                    this.cursor.Down();
                break;
            case 'ArrowLeft':
                // if (event.shiftKey && event.ctrlKey)
                //     this.hierarchy.MoveLeft(false);
                break;
            case 'ArrowRight':
                // if (event.shiftKey && event.ctrlKey)
                //     this.hierarchy.MoveRight(false);
                break;
            case 'Tab':
                // event.preventDefault();
                // event.shiftKey ? this.hierarchy.MoveLeft() : this.hierarchy.MoveRight(false);
                break;

            case 'Enter':
                if (!event.shiftKey) {
                    await this.messageService.Create();
                    event.preventDefault();
                }
                break;
            case 'Delete':
                if (event.shiftKey) {
                    await this.contextService.Detach();
                    event.preventDefault();
                }
                break;
            case 'C':
                // if (event.ctrlKey)
                //     this.copy = this.cursor.getCurrent();
                event.preventDefault();
                break;
            case 'V':
                // if (event.ctrlKey)
                //     this.hierarchy.Add(this.copy);
                event.preventDefault();
                break;
            case '.':
            case 'ю':
                if (event.ctrlKey){
                    const current = this.cursor.getCurrent();
                    current.Collapsed = !current.Collapsed;
                    current.Update.next(null);
                }
            default:
            // console.log(event.key)
        }

    }

    public Actions$ = merge(
        fromEvent(document, 'keydown').pipe(
            tap((event: KeyboardEvent) => this.Action(event))
        ),

        fromEvent(document, 'keyup').pipe(
            tap(() => {

            })
        )
    );
}