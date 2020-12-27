import {DateTime} from "luxon";
import {User} from "./user";
import { Context } from "./context";

export class Message {
    public Content: string;
    public Author: User;
    public CreatedAt: DateTime;
    public Context: Context;
    public SubContext?: Context;
}