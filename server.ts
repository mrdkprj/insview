import path from "path";
import express from "express";
import session from "express-session";
import cors from "cors";
import { Sequelize, DataTypes, Options } from "sequelize";
import type { Cookie } from "tough-cookie";

import db from "./db/db"
import { AuthError, emptyResponse, IAuthResponse, IHistory, IMediaResponse, ISession, IUser } from "./src/response";
import { IMediaTable } from "./db/IDatabase";
import {login, challenge, requestMedia, requestMore, requestImage, logout, requestFollowings, getSession} from "./instagram"

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

const app = express();

const postgreOptions :Options = {
    dialect: "postgres",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
}
const sqliteOptions :Options = {dialect: "sqlite", storage: "./media.db"}

const sequelize = isProduction ? new Sequelize(process.env.DATABASE_URL ?? "", postgreOptions) : new Sequelize(sqliteOptions);
const SequelizeStore = require("connect-session-sequelize")(session.Store);
sequelize.define("Session", {
    sid: {type: DataTypes.STRING, primaryKey: true},
    account: {type: DataTypes.STRING},
    expires: {type: DataTypes.DATE},
    data: {type: DataTypes.TEXT},
});

const extendDefaultFields = (defaults:any, session:any) => {

    return {
      data: defaults.data,
      expires: defaults.expires,
      account: session.account,
    };
}

const sessionStore = new SequelizeStore({
    db: sequelize,
    table: "Session",
    extendDefaultFields: extendDefaultFields,
});

app.enable('trust proxy')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "build")));
app.use(session({
    secret: process.env.SECRET ?? "",
    store: sessionStore,
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

sessionStore.sync();

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

    const passthru = ["/login", "/logout"]

    if(req.session.account || passthru.includes(req.path) || req.method === "GET"){
        next()
    }else{
        sendErrorResponse(res, new AuthError(""))
    }

})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.post("/query", async (req, res) => {

    const username = req.body.username;
    const history = req.body.history;
    const forceRequest = req.body.refresh;

    if(forceRequest){
        return await refresh(req, res, username, history);
    }

    if(!username){
        await tryRestore(req, res);
    }else{
        await getMedia(req, res, username, history);
    }

});

app.post("/querymore", async (req, res) => {

    const user = req.body.user;
    const next = req.body.next;

    await queryMore(req, res, user, next);

});

app.post("/login", async (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    await tryLogin(req, res, username, password);

})

app.post("/challenge", async (req, res) => {

    const username = req.body.username;
    const code = req.body.code;
    const endpoint = req.body.endpoint;

    await tryChallenge(req, res, username, code, endpoint);

})

app.post("/logout", async (req:any, res:any) => {

    await tryLogout(req, res);
})

app.get("/media", async (req,res) => {

    await retrieveImage(req, res)

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

    await getFollowings(req, res, next)
})

const tryRestore = async (req:any, res:any) => {

    try{

        const session = getSession(req.headers);

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
const tryLogin = async (req:any, res:any, username:string, password:string) => {

    if(!username || !password){
        return sendErrorResponse(res, {message:"Username/password required"});
    }

    try{

        const result = await login({data:{username, password}, headers:req.headers})

        if(result.data.success){
            req.session.account = username;
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

const tryChallenge = async (req:any, res:any, username:string, code:string, endpoint:string) => {

    try{

        const result = await challenge({data:{code, endpoint}, headers:req.headers})

        if(result.data.success){
            req.session.account = username;
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

        await logout({data:{}, headers:req.headers});

        req.session.destroy();

        res.status(200).send({success:true});

    }catch(ex:any){

        sendErrorResponse(res, ex);

    }
}

const getMedia = async (req:any, res:any, username:string, history:IHistory) => {

    let newHistory :IHistory = history;

    try{

        const mediaData :IMediaTable = await db.queryMedia(req.session.account, username);

        if(mediaData.username){

            const session = getSession(req.headers);

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

        const igResponse = await requestMedia({data:{username}, headers: req.headers});

        newHistory[igResponse.data.username] = igResponse.data.user;

        igResponse.data.history = newHistory;

        await db.saveMedia(req.session.account, igResponse.data);
        await db.saveHistory(req.session.account, username, newHistory);

        await sendResponse(req, res, igResponse.data, igResponse.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }
}

const queryMore = async (req:any, res:any, user:IUser, next:string) => {

    try{

        const historyData = await db.queryHistory(req.session.account);

        const igResponse = await requestMore({data:{user, next}, headers:req.headers});

        igResponse.data.history = historyData.history;

        await db.appendMedia(req.session.account,igResponse.data);

        await sendResponse(req, res, igResponse.data, igResponse.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }

}

const refresh = async  (req:any, res:any, username:string, history:IHistory) => {

    try{

        const igResponse = await requestMedia({data:{username},headers:req.headers});

        igResponse.data.history = history;

        await db.saveMedia(req.session.account, igResponse.data);

        await sendResponse(req, res, igResponse.data, igResponse.session);

    }catch(ex:any){

        return sendErrorResponse(res, ex);

    }

}

const getFollowings = async (req:any, res:any, next:string) => {

    try{

        const result = await requestFollowings({data:{next},headers:req.headers});

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

        const result = await requestImage(url.join(""));

        Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));

        result.data.pipe(res);

    }catch(ex:any){
        sendErrorResponse(res, ex, "image not found");
    }
}

app.listen(port, () => {
    console.log(`Start server on port ${port}.`);
});