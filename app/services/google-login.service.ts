import {IAccountInfo, IAccountProvider} from "@infr/account.manager";

export class GoogleLoginService implements IAccountProvider{
    type: string = 'google';

    async Check(): Promise<IAccountInfo> {
        const str = localStorage["google:acc"];
        if (str) {
            return JSON.parse(str) as IAccountInfo;
        }
        // @ts-ignore
        const cookie = await cookieStore.get('jwt:google');
        if (!cookie)
            return undefined;
        const token = cookie.value;
        const user = await fetch(`https://www.googleapis.com/userinfo/v2/me`,{
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(x => x.ok ? x.json() : null);
        if (user == null)
            return undefined;
        const acc = {
            defaultStorage: location.origin,
            title: user.name,
            id: user.email,
            type: 'google',
            session: {}
        } as IAccountInfo;
        localStorage.setItem('google:acc', JSON.stringify(acc));
        return acc;
    }

    async Login(): Promise<IAccountInfo> {
        location.href = await fetch('/api/auth/google/url?'+new URLSearchParams({
            redirect: location.href
        }).toString()).then(x => x.text())
        return undefined;
    }

    async Logout(){
        // @ts-ignore
        cookieStore.delete('jwt:google');
        localStorage.removeItem('google:acc');
    }
}