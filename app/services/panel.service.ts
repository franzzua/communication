import {BehaviorSubject, Injectable} from "@hypertype/core";
import {wire} from "@hypertype/ui";

@Injectable()
export class PanelService {

    private _panelSubject = new BehaviorSubject({})
    public Panels$ = this._panelSubject.asObservable();

    public ShowPanel(content, type: PanelType) {
        this._panelSubject.next({
            ...this._panelSubject.value,
            [type]: content
        });
    }

    public ClosePanel(type: PanelType) {
        this._panelSubject.next({
            ...this._panelSubject.value,
            [type]: null
        });
    }
}

export type PanelType = 'Top' | 'Bottom' | 'Left' | 'Right'