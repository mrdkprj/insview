import axios, { AxiosRequestConfig } from "axios";
import { baseUrl, createHeaders, getSession, updateSession, CookieStore, logError } from "./util";
import { AuthError, RequestError } from "../entity";

const requestFollowings = async (req:IgRequest) : Promise<IgResponse<IFollowing>> => {

    const jar = new CookieStore();

    const currentSession = getSession(req.headers);
/*
    const params = req.data.next ? {
        id: currentSession.userId,
        first:20,
        after: req.data.next
    } : {
        id: currentSession.userId,
        first:20
    }
*/

    const params = req.data.next ? "&max_id=12" : ""
    try{
        //https://i.instagram.com/api/v1/friendships/${userid}/following/?count=12&max_id=1
        //https://www.instagram.com/api/v1/friendships/52714401302/following/?count=12
        //const url = `https://www.instagram.com/graphql/query/?query_hash=58712303d941c6855d4e888c5f0cd22f&variables=${encodeURIComponent(JSON.stringify(params))}`
        const url = `https://www.instagram.com/api/v1/friendships/${currentSession.userId}/following/?count=12${params}`

        const headers = createHeaders(baseUrl, currentSession);
        await jar.storeRequestCookie(req.headers.cookie)
        headers.Cookie = await jar.getCookieStrings();

        const options :AxiosRequestConfig = {
            url,
            method: "GET",
            headers,
        }

        const response = await axios.request(options);

        if(response.headers["content-type"].includes("html")){
            throw new AuthError({message:"", data:{}, requireLogin:true})
        }

        let cookies = await jar.storeCookie(response.headers["set-cookie"])
        const data = _formatFollowings(response.data);
        const session = updateSession(currentSession, cookies);
        cookies = await jar.getCookies();

        return {
            data,
            session,
            cookies
        }

    }catch(ex:any){

        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin)

    }
}

const _formatFollowings = (data:any) :IFollowing => {
/*
    const dataNode = data.data.user.edge_follow;

    const users :IUser[] = dataNode.edges.map((user:any) :IUser => {

        return {
            id:user.node.id,
            igId:user.node.id,
            username:user.node.username,
            name:user.node.full_name,
            biography:"",
            profileImage: "/image?url=" + encodeURIComponent(user.node.profile_pic_url),
            following: true,
            isPro:false,
        }
    })
*/

    const users :IUser[] = data.users.map((user:any) :IUser => {

        return {
            id:user.pk_id,
            igId:user.pk_id,
            username:user.username,
            name:user.full_name,
            biography:"",
            profileImage: "/image?url=" + encodeURIComponent(user.profile_pic_url),
            following: true,
            isPro:false,
        }
    })

    const hasNext = data.next_max_id ? true : false //dataNode.page_info.has_next_page;
    //const next = hasNext ? dataNode.page_info.end_cursor : "";
    const next = hasNext ? data.next_max_id : "";

    return {users, hasNext, next};

}


const follow = async (req:IgRequest):Promise<IgResponse<any>> => {

    const jar = new CookieStore();

    const currentSession = getSession(req.headers);

    if(!currentSession.isAuthenticated){
        throw new AuthError({message:"", data:{}, requireLogin:true})
    }

    try{

        const url = `${baseUrl}/web/friendships/${req.data.user.id}/follow/`

        const headers = createHeaders(baseUrl, currentSession);
        await jar.storeRequestCookie(req.headers.cookie);
        headers.Cookie = await jar.getCookieStrings();

        const options :AxiosRequestConfig = {
            url,
            method: "POST",
            headers,
            withCredentials:true
        }

        const response = await axios.request(options);

        let cookies = await jar.storeCookie(response.headers["set-cookie"])
        const data = response.data;
        const session = updateSession(currentSession, cookies);
        cookies = await jar.getCookies();

        return {
            data,
            session,
            cookies
        }

    }catch(ex:any){
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin)
    }
}

const unfollow = async (req:IgRequest):Promise<IgResponse<any>> => {

    const jar = new CookieStore();

    const currentSession = getSession(req.headers);

    if(!currentSession.isAuthenticated){
        throw new AuthError({message:"", data:{}, requireLogin:true})
    }

    try{

        const url = `${baseUrl}/web/friendships/${req.data.user.id}/unfollow/`

        const headers = createHeaders(baseUrl, currentSession);
        await jar.storeRequestCookie(req.headers.cookie);
        headers.Cookie = await jar.getCookieStrings();

        const options :AxiosRequestConfig = {
            url,
            method: "POST",
            headers,
            withCredentials:true
        }

        const response = await axios.request(options);

        let cookies = await jar.storeCookie(response.headers["set-cookie"])
        const data = response.data;
        const session = updateSession(currentSession, cookies);
        cookies = await jar.getCookies();

        return {
            data,
            session,
            cookies
        }

    }catch(ex:any){
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin)
    }
}

const tryUpdate = async (req:IgRequest):Promise<IgResponse<any>> => {

    const session = getSession(req.headers);

    const jar = new CookieStore(process.env.API_URL);
    const headers = createHeaders(baseUrl, session);

    const x = 10;
    if(x>0){
        const c = await jar.storeCookie(process.env.MOCK.split("@"))
        return {
            data:{},
            session,
            cookies:c
        }
    }
    try{

        headers.Cookie = await jar.getCookieStrings();

        const options :AxiosRequestConfig = {
            url: "https://www.instagram.com/api/v1/public/landing_info/",
            method: "GET",
            headers
        }

        const response = await axios.request(options);

        await jar.storeCookie(response.headers["set-cookie"])
        await jar.storeXHeaderCookie(session.xHeaders)
        const cookies = await jar.getCookies();

        return {
            data:{},
            session,
            cookies
        }

    }catch(ex:any){
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin)
    }
}

export {requestFollowings, follow, unfollow, tryUpdate}