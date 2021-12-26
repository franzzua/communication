import {IAccountInfo} from "@services";
import {IEventHandler} from "@hypertype/ui";

export const AppInitTemplate = (html, state: IAccountInfo[], events: IEventHandler<IEvents>) => html`
    <h1>Welcome back, my bloody son!</h1>
    ${state.length ? state.map(acc => html(acc)`
        <div>${acc.title}</div>
    `) : html('no-acc')`<div>
        <h3>But... who are you?</h3>
        <div class="google-btn disabled" onclick=${events.login(() => 'google')}>
          <div class="google-icon-wrapper">
            <img class="google-icon" src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"/>
          </div>
          <p class="btn-text"><b>Sign in with google</b></p>
        </div>        
        <div class="google-btn" onclick=${events.login(() => 'fake')}>
          <div class="google-icon-wrapper">
            <span>FFF</span>
          </div>
          <p class="btn-text"><b>Sign in with fake</b></p>
        </div>     
    </div>`}
`;

export type IEvents = {
    login(provider: 'google');
}