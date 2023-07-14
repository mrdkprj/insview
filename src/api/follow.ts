import axios, { AxiosRequestConfig } from "axios";
import { baseUrl, createHeaders, getSession, updateSession, CookieStore, logError } from "./util";
import { AuthError, RequestError } from "../entity";

const requestFollowings = async (req:IgRequest) : Promise<IgResponse<IFollowing>> => {

    const jar = new CookieStore();

    const currentSession = getSession(req.headers);

    const params = req.data.next ? {
        id: currentSession.userId,
        first:20,
        after: req.data.next
    } : {
        id: currentSession.userId,
        first:20
    }

    try{
        //https://i.instagram.com/api/v1/friendships/${userid}/following/?count=12&max_id=1
        const url = `https://www.instagram.com/graphql/query/?query_hash=58712303d941c6855d4e888c5f0cd22f&variables=${encodeURIComponent(JSON.stringify(params))}`

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
            throw new AuthError({message:"Session expired", data:{}, requireLogin:true})
        }

        const cookies = await jar.storeCookie(response.headers["set-cookie"])
        const data = _formatFollowings(response.data);
        const session = updateSession(currentSession, cookies);

        return {
            data,
            session
        }

    }catch(ex:any){

        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin)

    }
}

const _formatFollowings = (data:any) :IFollowing => {

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

    const hasNext = dataNode.page_info.has_next_page;
    const next = hasNext ? dataNode.page_info.end_cursor : "";

    return {users, hasNext, next};

}


const follow = async (req:IgRequest) => {

    const jar = new CookieStore();

    const currentSession = getSession(req.headers);

    if(!currentSession.isAuthenticated){
        throw new AuthError({message:"Session expired", data:{}, requireLogin:true})
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

        const cookies = await jar.storeCookie(response.headers["set-cookie"])
        const data = response.data;
        const session = updateSession(currentSession, cookies);

        return {
            data,
            session
        }

    }catch(ex:any){
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin)
    }
}

const unfollow = async (req:IgRequest) => {

    const jar = new CookieStore();

    const currentSession = getSession(req.headers);

    if(!currentSession.isAuthenticated){
        throw new AuthError({message:"Session expired", data:{}, requireLogin:true})
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

        const cookies = await jar.storeCookie(response.headers["set-cookie"])
        const data = response.data;
        const session = updateSession(currentSession, cookies);

        return {
            data,
            session
        }

    }catch(ex:any){
        const error = logError(ex);
        throw new RequestError(error.message, error.requireLogin)
    }
}

export {requestFollowings, follow, unfollow}