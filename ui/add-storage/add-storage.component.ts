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
        Messages: [
            {
                Content: 'Solid',
                Description: 'your personal Storage and identity storage',
                Action: 'Storage.join.solid'
            },
            {
                Content: 'Google Drive',
                Description: 'Storage storage managed by Google',
                Action: 'Storage.join.google-drive'
            },
            {
                Content: 'Gmail',
            },
            {
                Content: 'Slack',
            },
            {
                Content: 'Jira',
            },
            {
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
    