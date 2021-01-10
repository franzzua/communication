import * as auth from "solid-auth-cli";

export class SolidLoginMock {
    public async Login(path: string = undefined){
        const session = await auth.login(path);
        return  {
            title: 'Solid account',
            type: 'solid',
            session
        };
    }
}
