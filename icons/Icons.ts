import {wire} from "@hypertype/ui";

const  getIcon = ( name, file) => (html, style: object, classes: string[], on: {
    click?, hover?
}) => {
    classes = [...classes, 'icon', name];
    return html(name)`
    <svg style=${style} class=${classes.join(' ')}
         viewBox="-4 -4 68 68" 
         onclick=${on.click} onmouseover=${on.hover}>
        ${html(`svg:${name}-inner`)([file])}
    </svg>
`;
}

export const Icons = {
    move: {
        left :getIcon('move-left', require('./arrows_circle_left.svg')),
        right :getIcon('move-right', require('./arrows_circle_right.svg')),
    },
    plus: {
        message: getIcon('add-message', require('./message_plus.svg')),
        list: getIcon('add-list', require('./todolist_plus.svg')),
    },
    addUser: getIcon('add-user', require('./cloud_plus.svg'))
}
