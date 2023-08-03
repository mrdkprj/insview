import {Request, Response} from "express";
import type { Cookie } from "tough-cookie";
import { AuthError, RequestError, emptyResponse } from "./entity"
import * as api from "./api/instagram"

declare module "express-session" {
    interface SessionData {
        account: any
    }
}

class Controller{

    db:IDatabase

    constructor(db:IDatabase){
        this.db = db;
        this.db.create();
    }

    private convertSameSite(_sameSite:string){

        if(!_sameSite) return "none"

        if(_sameSite.toLowerCase() === "lax") return "lax"

        if(_sameSite.toLowerCase() === "strict") return "strict"

        if(_sameSite.toLowerCase() === "none") return "none"

        return false;
    }

    async sendResponse<T>(req:Request, res:Response, data:IgResponse<T>){

        const domain = process.env.NODE_ENV === "production" ? req.hostname : ""

        data.cookies.forEach((cookie:Cookie) => {

            if(typeof cookie.maxAge === "number" && cookie.maxAge <= 0) return;

            const sameSite = this.convertSameSite(cookie.sameSite);
            let secure = cookie.secure;
            if(!secure && sameSite == "none"){
                secure = true;
            }

            console.log(`key:${cookie.key}, expires:${cookie.expires}`)

            res.cookie(cookie.key, cookie.value, {
                domain:domain,
                expires:cookie.expires === "Infinity" ? undefined : cookie.expires,
                httpOnly:cookie.httpOnly,
                path:cookie.path ?? undefined,
                secure,
                sameSite:sameSite,
                encode: String
            });

        })

        res.set({"ig-auth":data.session.isAuthenticated});

        res.status(200).send(data.data);

    }

    sendErrorResponse(res:Response, ex:any){

        const data = ex instanceof AuthError ? ex.detail : {message:ex.message}

        if(ex instanceof AuthError){
            res.set({"ig-auth":!ex.detail.requireLogin});
        }

        if(ex instanceof RequestError){
            res.set({"ig-auth":!ex.requireLogin});
        }

        res.status(400).send(data)
    }

    async tryRestore(req:Request, res:Response){

        try{
console.log(req.headers.cookie)
            const session = api.getSession(req.headers);

            const result = await this.db.restore(req.session.account);

            result.isAuthenticated = session.isAuthenticated;
            result.account = req.session.account

            await this.sendResponse(req, res, {data:result, session, cookies:[]});

        }catch(ex:any){

            this.sendErrorResponse(res, new Error("Restore failed"))
        }

    }

    private async restoreBySession(req:Request){

        if(!req.session.account){
            return emptyResponse;
        }

        try{
            return await this.db.restore(req.session.account);
        }catch(ex:any){
            return emptyResponse;
        }

    }

    private async saveSession(req:Request, account:string, session:ISession){

        req.session.account = account

        if(session.expires){
            const maxAge = session.expires.getTime() - new Date().getTime();
            req.session.cookie.maxAge = maxAge
        }
    }

    async tryLogin(req:Request, res:any, account:string, password:string){

        if(!account || !password){
            return this.sendErrorResponse(res, new Error("Username/password required"));
        }

        if(account !== process.env.ACCOUNT){
            return this.sendErrorResponse(res, new Error("Unauthorized account"))
        }

        try{

            const result = await api.login({data:{account, password}, headers:req.headers})

            if(result.data.success){
                this.saveSession(req, account, result.session);
            }

            const media = await this.restoreBySession(req);

            const authResponse :IAuthResponse = {
                status: result.data,
                media
            }

            const response:IgResponse<IAuthResponse> = {
                data:authResponse,
                session:result.session,
                cookies:result.cookies
            }

            await this.sendResponse(req, res, response);

        }catch(ex:any){
            this.sendErrorResponse(res, ex);

        }
    }

    async tryChallenge(req:Request, res:any, account:string, code:string, endpoint:string){

        try{

            const result = await api.challenge({data:{account, code, endpoint}, headers:req.headers})

            if(result.data.success){
                this.saveSession(req, account, result.session);
            }

            const media = await this.restoreBySession(req);

            const authResponse :IAuthResponse = {
                status: result.data,
                media
            }

            const response:IgResponse<IAuthResponse> = {
                data:authResponse,
                session:result.session,
                cookies:result.cookies
            }

            await this.sendResponse(req, res, response);

        }catch(ex:any){

            this.sendErrorResponse(res, ex);

        }

    }

    async tryLogout(req:Request, res:any){

        try{

            const result = await api.logout({data:{}, headers:req.headers});

            req.session.destroy(_e => {console.log(_e)});

            const authResponse :IAuthResponse = {
                status: result.data,
                media:emptyResponse,
            }

            const response:IgResponse<IAuthResponse> = {
                data:authResponse,
                session:result.session,
                cookies:result.cookies
            }

            await this.sendResponse(req, res, response);

        }catch(ex:any){

            this.sendErrorResponse(res, ex);

        }
    }

    async tryQuery(req:Request, res:any, username:string, history:IHistory, preview:boolean){

        const newHistory :IHistory = history;

        try{

            const exisitingData = await this.db.queryMedia(req.session.account, username);

            let mediaResponse:IgResponse<IMediaResponse>;

            if(exisitingData.username){
                const session = api.getSession(req.headers);
                mediaResponse = {
                    session,
                    data: {
                        username: exisitingData.username,
                        media: exisitingData.media,
                        user: exisitingData.user,
                        rowIndex: exisitingData.rowIndex,
                        next: exisitingData.next,
                        history: newHistory,
                        isAuthenticated: session.isAuthenticated
                    },
                    cookies:[]
                }

            }else{
                mediaResponse = await api.requestMedia({data:{username}, headers: req.headers});
            }

            if(!preview){
                newHistory[mediaResponse.data.username] = mediaResponse.data.user;
                mediaResponse.data.history = newHistory;
                await this.db.saveHistory(req.session.account, username, newHistory);
                await this.db.saveMedia(req.session.account, mediaResponse.data);
            }

            await this.sendResponse(req, res, mediaResponse);

        }catch(ex:any){
            console.log("try query error")
            return this.sendErrorResponse(res, ex);

        }
    }

    async tryQueryMore(req:any, res:any, user:IUser, next:string, preview:boolean){

        try{

            const historyData = await this.db.queryHistory(req.session.account);

            const mediaResponse = await api.requestMore({data:{user, next}, headers:req.headers});

            if(!preview){
                mediaResponse.data.history = historyData.history;
                await this.db.appendMedia(req.session.account, mediaResponse.data);
            }

            await this.sendResponse(req, res, mediaResponse);

        }catch(ex:any){
            console.log("try query more error")
            return this.sendErrorResponse(res, ex);

        }

    }

    async tryReload(req:any, res:any, username:string, history:IHistory){

        try{

            const mediaResponse = await api.requestMedia({data:{username},headers:req.headers});

            history[username] = mediaResponse.data.history[username];

            mediaResponse.data.history = history;

            await this.db.saveMedia(req.session.account, mediaResponse.data);

            await this.sendResponse(req, res, mediaResponse);

        }catch(ex:any){
            console.log("tryReload error")
            return this.sendErrorResponse(res, ex);

        }

    }

    async tryGetFollowings(req:any, res:any, next:string){

        try{

            const result = await api.requestFollowings({data:{next},headers:req.headers});

            await this.sendResponse(req, res, result);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }

    }

    async tryFollow(req:any, res:any, user:any){

        try{

            const result = await api.follow({data:{user},headers:req.headers});

            await this.sendResponse(req, res, result);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }

    }

    async tryUnfollow(req:any, res:any, user:any){

        try{

            const result = await api.unfollow({data:{user},headers:req.headers});

            await this.sendResponse(req, res, result);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }

    }

    async trySaveRowIndex(req:Request, res:Response, account:string, username:string, rowIndex:number){

        try{

            await this.db.saveRowIndex(account, username, rowIndex);

            res.status(200).send({status:"done"});

        }catch(ex:any){

            this.sendErrorResponse(res, new Error("Update failed"))
        }
    }

    async tryDeleteHistory(_req:Request, res:Response, account:string, currentUsername:string, deleteUsername:string, history:IHistory){

        try{

            await this.db.deleteMedia(account, deleteUsername);
            await this.db.saveHistory(account, currentUsername, history)
            res.status(200).send({status:"done"});

        }catch(ex:any){

            this.sendErrorResponse(res, new Error("Delete failed"))

        }

    }

    async retrieveMedia(req:Request, res:Response){

        try{

            if(!req.query.url || typeof req.query.url !== "string"){
                return this.sendErrorResponse(res, new Error("no url specified"));
            }

            const result = await api.downloadMedia(req.query.url)

            Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));

            if(req.query.id){
                res.attachment(`${req.query.id}.mp4`)
            }

            result.data.pipe(res);

        }catch(ex:any){

            this.sendErrorResponse(res, new Error("Media not found"))

        }
    }

}

export default Controller