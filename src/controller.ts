import {Request, Response} from "express";
import type { Cookie } from "tough-cookie";
import { IAuthResponse, IHistory, IMediaResponse, ISession, IUser, emptyResponse, AuthError } from "@shared"
import { IMediaTable } from "./types/IDatabase";
import { IDatabase } from "types/IDatabase";
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

    _convertSameSite(_sameSite:string){

        if(!_sameSite) return undefined

        if(_sameSite.toLowerCase() === "lax") return "lax"

        if(_sameSite.toLowerCase() === "strict") return "strict"

        if(_sameSite.toLowerCase() === "none") return "none"

        return false;
    }

    async sendResponse(req:Request, res:Response, data:any, session:ISession){

        const domain = process.env.NODE_ENV === "production" ? req.hostname : ""

        session.cookies.forEach((cookie:Cookie) => {

            if(cookie.maxAge <= 0) return;

            res.cookie(cookie.key, cookie.value, {
                domain:domain,
                expires:cookie.expires === "Infinity" ? undefined : cookie.expires,
                httpOnly:cookie.httpOnly,
                path:cookie.path ?? undefined,
                secure:cookie.secure,
                sameSite:this._convertSameSite(cookie.sameSite),
                encode: String
            });

        })

        res.set({"ig-auth":session.isAuthenticated});

        res.status(200).send(data);

    }

    sendErrorResponse(res:Response, ex:any, message = ""){

        let loginRequired = false;

        let errorMessage
        if(message){
            errorMessage = message;
        }else{
            errorMessage = ex.response ? ex.response.data.message : ex.message;
        }

        if(ex.response){
            loginRequired = ex.response.data.require_login
        }

        if(ex instanceof AuthError || loginRequired){
            res.set({"ig-auth":false});
        }else{
            res.set({"ig-auth":true});
        }

        res.status(400).send(errorMessage)
    }

    async tryRestore(req:Request, res:Response){

        try{

            const session = api.getSession(req.headers);

            const result = await this.db.restore(req.session.account);

            result.isAuthenticated = session.isAuthenticated;
            result.account = req.session.account

            await this.sendResponse(req, res, result, session);

        }catch(ex:any){

            this.sendErrorResponse(res, ex, "Restore failed");
        }

    }

    async restoreBySession(req:Request){

        if(!req.session.account){
            return emptyResponse;
        }

        try{
            return await this.db.restore(req.session.account);
        }catch(ex:any){
            return emptyResponse;
        }

    }

    async saveSession(req:Request, account:string, session:ISession){

        req.session.account = account

        if(session.expires){
            const maxAge = session.expires.getTime() - new Date().getTime();
            req.session.cookie.maxAge = maxAge
        }
    }

    async tryLogin(req:Request, res:any, account:string, password:string){

        if(!account || !password){
            return this.sendErrorResponse(res, {message:"Username/password required"});
        }

        if(account !== process.env.ACCOUNT){
            return this.sendErrorResponse(res, {message:"Unauthorized account"});
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

            await this.sendResponse(req, res, authResponse, result.session);

        }catch(ex:any){

            this.sendErrorResponse(res, ex, "Login failed");

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

            await this.sendResponse(req, res, authResponse, result.session);

        }catch(ex:any){

            this.sendErrorResponse(res, ex, "Challenge failed");

        }

    }

    async tryLogout(req:Request, res:any){

        try{

            const result = await api.logout({data:{}, headers:req.headers});

            req.session.destroy(_e => {throw new Error("Session not destroyed")});

            const authResponse :IAuthResponse = {
                status: result.data,
                media:emptyResponse,
            }

            await this.sendResponse(req, res, authResponse, result.session);

        }catch(ex:any){

            this.sendErrorResponse(res, ex);

        }
    }

    async tryQuery(req:Request, res:any, username:string, history:IHistory, preview:boolean){

        const newHistory :IHistory = history;

        try{

            const exisitingData :IMediaTable = await this.db.queryMedia(req.session.account, username);

            let session;
            let igResponse:IMediaResponse;

            if(exisitingData.username){
                session = api.getSession(req.headers);
                igResponse = {
                    username: exisitingData.username,
                    media: exisitingData.media,
                    user: exisitingData.user,
                    rowIndex: exisitingData.rowIndex,
                    next: exisitingData.next,
                    history: newHistory,
                    isAuthenticated: session.isAuthenticated
                }

            }else{
                const result = await api.requestMedia({data:{username}, headers: req.headers});
                igResponse = result.data
                session = result.session
            }

            if(!preview){
                newHistory[igResponse.username] = igResponse.user;
                igResponse.history = newHistory;
                await this.db.saveHistory(req.session.account, username, newHistory);
                await this.db.saveMedia(req.session.account, igResponse);
            }

            await this.sendResponse(req, res, igResponse, session);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }
    }

    async tryQueryMore(req:any, res:any, user:IUser, next:string, preview:boolean){

        try{

            const historyData = await this.db.queryHistory(req.session.account);

            const igResponse = await api.requestMore({data:{user, next}, headers:req.headers});

            if(!preview){
                igResponse.data.history = historyData.history;
                await this.db.appendMedia(req.session.account,igResponse.data);
            }

            await this.sendResponse(req, res, igResponse.data, igResponse.session);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }

    }

    async tryRefresh(req:any, res:any, username:string, history:IHistory){

        try{

            const igResponse = await api.requestMedia({data:{username},headers:req.headers});

            history[username] = igResponse.data.history[username];

            igResponse.data.history = history;

            await this.db.saveMedia(req.session.account, igResponse.data);

            await this.sendResponse(req, res, igResponse.data, igResponse.session);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }

    }

    async tryGetFollowings(req:any, res:any, next:string){

        try{

            const result = await api.requestFollowings({data:{next},headers:req.headers});

            await this.sendResponse(req, res, result.data, result.session);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }

    }

    async tryFollow(req:any, res:any, user:any){

        try{

            const result = await api.follow({data:{user},headers:req.headers});

            await this.sendResponse(req, res, result.data, result.session);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }

    }

    async tryUnfollow(req:any, res:any, user:any){

        try{

            const result = await api.unfollow({data:{user},headers:req.headers});

            await this.sendResponse(req, res, result.data, result.session);

        }catch(ex:any){

            return this.sendErrorResponse(res, ex);

        }

    }

    async trySaveRowIndex(req:Request, res:Response, account:string, username:string, rowIndex:number){

        try{

            await this.db.saveRowIndex(account, username, rowIndex);

            res.status(200).send({status:"done"});

        }catch(ex:any){

            this.sendErrorResponse(res, ex, "Update failed");
        }
    }

    async tryDeleteHistory(_req:Request, res:Response, account:string, currentUsername:string, deleteUsername:string, history:IHistory){

        try{

            await this.db.deleteMedia(account, deleteUsername);
            await this.db.saveHistory(account, currentUsername, history)
            res.status(200).send({status:"done"});

        }catch(ex:any){

            this.sendErrorResponse(res, ex, "Delete failed");

        }

    }

    async retrieveImage(req:Request, res:Response){

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
            this.sendErrorResponse(res, ex, "image not found");
        }
    }
}

export default Controller