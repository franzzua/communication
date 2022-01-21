import arrows_circle_left from "./arrows_circle_left.svg";
import arrows_circle_right from "./arrows_circle_right.svg";
import message_plus from "./message_plus.svg";
import todolist_plus from "./todolist_plus.svg";
import cloud_plus from "./cloud_plus.svg";

const getIcon = (name, file) => (html, style: object, classes: string[], on: {
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
        left: getIcon('move-left', arrows_circle_left),
        right: getIcon('move-right', arrows_circle_right),
    },
    plus: {
        message: getIcon('add-message', message_plus),
        list: getIcon('add-list', todolist_plus),
    },
    addUser: getIcon('add-user', cloud_plus)
}
