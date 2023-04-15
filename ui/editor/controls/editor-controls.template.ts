import {ITemplate} from "@cmmn/ui";
import {SizeInfo} from "./text-measure";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <div class="burger">☰</div>
    <div class="outline" style=${{
        'margin-top': -state.Size.Height+'px'
    }}>
        <div class="outline" style=${{
            top: state.Size.Top+'px',
            // background: '#23AA',
            height: state.Size.SmallLetterTop - state.Size.Top+'px',
            width: state.Size.Width + 'px'
        }}></div>
        <div class="outline" style=${{
            top:  state.Size.Baseline+'px',
            height: (state.Size.Down - state.Size.Baseline)+'px',
            left: 0,
            // background: '#2A3A',
            width: state.Size.Width + 'px'
        }}>
            
        </div>
        <div class="right">${state.Text}</div>
    </div>
`

export type IState = {
    Text: string;
    Size: {
        Top: number;
        SmallLetterTop: number;
        Baseline: number;
        Down: number;
        Width: number;
        Height: number;
    };
}

export type IEvents = {}