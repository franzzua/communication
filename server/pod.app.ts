import createApp from "solid-server";

export const podApp = createApp({
    webid: true,
    auth: 'oidc',
    root: './.work',
    dbPath: './.work/.db',
    strictOrigin: false,
    port: 3000,
    serverUri: process.env.SERVER || 'http://localhost:3000',
});

