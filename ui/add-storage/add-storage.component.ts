import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./add-storage.template";
import {of} from "@hypertype/core";
import {Context} from "@model";

@Component({
    name: 'add-storage',
    template: Template,
    style: require('./add-storage.style.less')
})
export class AddStorageComponent extends HyperComponent<IState, IEvents> {

    public MessagesContext: Context = {
        URI: 'root://add-storage',
        id:  'root://add-storage',
        Messages: [
            {
                URI: undefined,
                id: undefined,
                Content: 'Solid',
                Description: 'your personal Storage and identity storage',
                Action: 'Storage.join.solid'
            },
            {
                URI: undefined,
                id: undefined,
                Content: 'Google Drive',
                Description: 'Storage storage managed by Google',
                Action: 'Storage.join.google-drive'
            },
            {
                URI: undefined,
                id: undefined,
                Content: 'Gmail',
            },
            {
                URI: undefined,
                id: undefined,
                Content: 'Slack',
            },
            {
                URI: undefined,
                id: undefined,
                Content: 'Jira',
            },
            {
                URI: undefined,
                id: undefined,
                Content: 'Telegram',
            }
        ]
    };

    public Context = {
        Messages: [
            {
                Content: 'Storages',
                SubContext: this.MessagesContext,
                IsEditable: false
            }
        ]
    }

    public State$ = of(this.Context);

    public Events = {
        join: async (type) => {

        }
    }
}
