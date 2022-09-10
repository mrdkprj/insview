import path from "path";
import express from "express";
import session from "express-session";
import cors from "cors";
import type { Cookie } from "tough-cookie";

import { IAuthResponse, IHistory, IMediaResponse, ISession, IUser } from "./types/type";
import { emptyResponse, AuthError } from "./types"
import { IMediaTable } from "./db/IDatabase";
import db from "./db/db"
import {sessionStoreFactory, StoreType} from "./store/storeFactory"
import * as api from "./api/instagram"

declare module "express-session" {
    interface SessionData {
        account: any
    }
}

const port = process.env.PORT || 5000

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
    require("dotenv").config();
}

const publicDir = isProduction ? "/public" : "../public"

const app = express();

const store = sessionStoreFactory(session, isProduction ? StoreType.azure : StoreType.sqlite)

app.enable('trust proxy')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.resolve(__dirname, publicDir)));
app.use(session({
    secret: process.env.SECRET ?? "",
    store: store,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: isProduction ? true: false,
        httpOnly: true,
        maxAge: 86400000,
        sameSite: isProduction ? "none" : "strict"
    }
}))

db.create();

const sendResponse = async (req:any, res:any, data:any, session:ISession) => {

    const domain = isProduction ? req.hostname : ""

    session.cookies.forEach((cookie:Cookie) => {

        if(cookie.maxAge <= 0) return;

        res.cookie(cookie.key, cookie.value, {
            domain:domain,
            expires:cookie.expires,
            httpOnly:cookie.httpOnly,
            path:cookie.path,
            secure:cookie.secure,
            sameSite:cookie.sameSite,
            encode: String
        });

    })

    res.set({"ig-auth":session.isAuthenticated});

    res.status(200).send(data);

}

const sendErrorResponse = (res:any, ex:any, message:string = "") => {

    let errorMessage
    if(message){
        errorMessage = message;
    }else{
        errorMessage = ex.resposne ? ex.response.data : ex.message;
    }

    if(ex instanceof AuthError){
        res.set({"ig-auth":false});
    }else{
        res.set({"ig-auth":true});
    }

    res.status(400).send(errorMessage)
}


app.use((req, res, next) => {

    const passthru = ["/login", "/logout", "/challenge"]

    if(req.session.account || passthru.includes(req.path) || req.method === "GET"){
        next()
    }else{
        sendErrorResponse(res, new AuthError(""))
    }

})

app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, publicDir, "index.html"));
});

app.get("/media", async (req,res) => {

    await retrieveImage(req, res)

})

app.post("/query", async (req, res) => {

    const username = req.body.username;
    const history = req.body.history;
    const forceRequest = req.body.refresh;

    if(forceRequest){
        return await tryRefresh(req, res, username, history);
    }

    if(!username){
        await tryRestore(req, res);
    }else{
        await tryQuery(req, res, username, history);
    }

});

app.post("/querymore", async (req, res) => {

    const user = req.body.user;
    const next = req.body.next;

    await tryQueryMore(req, res, user, next);

});

app.post("/login", async (req, res) => {

    const account = req.body.account;
    const password = req.body.password;

    await tryLogin(req, res, account, password);

})

app.post("/challenge", async (req, res) => {

    const account = req.body.account;
    const code = req.body.code;
    const endpoint = req.body.endpoint;

    await tryChallenge(req, res, account, code, endpoint);

})

app.post("/logout", async (req:any, res:any) => {

    await tryLogout(req, res);
})

app.post("/follow", async (req, res) => {

    const user = req.body.user;

    await tryFollow(req, res, user);

})

app.post("/unfollow", async (req, res) => {

    const user = req.body.user;

    await tryUnfollow(req, res, user);

})

app.post("/save", async (req, res) => {

    try{

        await db.saveRowIndex(req.session.account, req.body.username, req.body.rowIndex);

        res.status(200).send({status:"done"});

    }catch(ex:any){

        sendErrorResponse(res, ex, "Update failed");
    }

});

app.post("/remove", async (req, res) => {

    try{
        const history = req.body.history;
        const current = req.body.current;
        const target = req.body.target;
        await db.deleteMedia(req.session.account, target);
        await db.saveHistory(req.session.account, current, history)
        res.status(200).send({status:"done"});

    }catch(ex:any){
        sendErrorResponse(res, ex, "Delete failed");
    }
})

app.post("/following", async (req, res) => {

    const next = req.body.next;

    await tryGetFollowings(req, res, next)
})

const tryRestore = async (req:any, res:any) => {

    try{

        const session = api.getSession(req.headers);

        const result = await db.restore(req.session.account);

        result.isAuthenticated = session.isAuthenticated;

        await sendResponse(req, res, result, session);

    }catch(ex:any){

        sendErrorResponse(res, ex, "Restore failed");
    }

}

const restoreBySession = async (req:any) => {

    if(!req.session.account){
        return emptyResponse;
    }

    try{
       return await db.restore(req.session.account);
    }catch(ex:any){
        return emptyResponse;
    }

}

const saveSession = (req:any, account:string, session:ISession) => {

    req.session.account = account

    if(session.expires){
        const maxAge = session.expires.getTime() - new Date().getTime();
        req.session.cookie.maxAge = maxAge
    }
}

const tryLogin = async (req:any, res:any, account:string, password:string) => {

    if(!account || !password){
        return sendErrorResponse(res, {message:"Username/password required"});
    }

    try{

        const result = await api.login({data:{account, password}, headers:req.headers})

        if(result.data.success){
            saveSession(req, account, result.session);
        }

        const media = await restoreBySession(req);

        const authResponse :IAuthResponse = {
            status: result.data,
            media
        }

        await sendResponse(req, res, authResponse, result.session);

    }catch(ex:any){

        sendErrorResponse(res, ex, "Login failed");

    }
}

const tryChallenge = async (req:any, res:any, account:string, code:string, endpoint:string) => {

    try{

        const result = await api.challenge({data:{account, code, endpoint}, headers:req.headers})

        if(result.data.success){
            saveSession(req, account, result.session);
        }

        const media = await restoreBySession(req);

        const authResponse :IAuthResponse = {
            status: result.data,
            media
        }

        await sendResponse(req, res, authResponse, result.session);

    }catch(ex:any){

        sendErrorResponse(res, ex, "Challenge failed");

    }

}

const tryLogout = async (req:any, res:any) => {

    try{

        await api.logout({data:{}, headers:req.headers});

        req.session.destroy();

        res.status(200).send({success:true});

    }catch(ex:any){

        sendErrorResponse(res, ex);

    }
}

const tryQuery = async (req:any, res:any, username:string, history:IHistory) => {

    let newHistory :IHistory = history;

    try{

        const mediaData :IMediaTable = await db.queryMedia(req.session.account, username);

        if(mediaData.username){

            const session = api.getSession(req.headers);

            newHistory[mediaData.username] = mediaData.user

            await db.saveHistory(req.session.account, username, newHistory);

            const resultData :IMediaResponse = {
                username: mediaData.username,
                media: mediaData.media,
                user: mediaData.user,
                rowIndex: mediaData.rowIndex,
                next: mediaData.next,
                history: newHistory,
                isAuthenticated: session.isAuthenticated
            }

            return await sendResponse(req, res, resultData, session);

        }

        const igResponse = await api.requestMedia({data:{username}, headers: req.headers});

        newHistory[igResponse.data.username] = igResponse.data.user;

        igResponse.data.history = newHistory;

        await db.saveMedia(req.session.account, igResponse.data);
        await db.saveHistory(req.session.account, username, newHistory);

        await sendResponse(req, res, igResponse.data, igResponse.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }
}

const tryQueryMore = async (req:any, res:any, user:IUser, next:string) => {

    try{

        const historyData = await db.queryHistory(req.session.account);

        const igResponse = await api.requestMore({data:{user, next}, headers:req.headers});

        igResponse.data.history = historyData.history;

        await db.appendMedia(req.session.account,igResponse.data);

        await sendResponse(req, res, igResponse.data, igResponse.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }

}

const tryRefresh = async  (req:any, res:any, username:string, history:IHistory) => {

    try{

        const igResponse = await api.requestMedia({data:{username},headers:req.headers});

        history[username] = igResponse.data.history[username];

        igResponse.data.history = history;

        await db.saveMedia(req.session.account, igResponse.data);

        await sendResponse(req, res, igResponse.data, igResponse.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }

}

const tryGetFollowings = async (req:any, res:any, next:string) => {

    try{

        const result = await api.requestFollowings({data:{next},headers:req.headers});

        await sendResponse(req, res, result.data, result.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }

}

const tryFollow = async (req:any, res:any, user:any) => {

    try{

        const result = await api.follow({data:{user},headers:req.headers});

        await sendResponse(req, res, result.data, result.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }

}

const tryUnfollow = async (req:any, res:any, user:any) => {

    try{

        const result = await api.unfollow({data:{user},headers:req.headers});

        await sendResponse(req, res, result.data, result.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }

}

const retrieveImage = async (req:any, res:any) => {

    try{

        const url = Object.keys(req.query).map((key:any) => {
            if(key !== "url"){
                return "&" + key + "=" + req.query[key]
            }else{
                return req.query[key]
            }
        })

        const result = await api.requestImage(url.join(""));

        Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));

        result.data.pipe(res);

    }catch(ex:any){
        sendErrorResponse(res, ex, "image not found");
    }
}

app.listen(port, () => {
    console.log(`Start server on port ${port}.`);
});