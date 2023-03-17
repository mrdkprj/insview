import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {baseUrl, baseRequestHeaders, getSession, updateSession, createHeaders, CookieStore, extractRequestCookie, logError} from "./util"
import { IMedia, IMediaResponse, IUser, IgRequest, IgResponse, ISession, AuthError} from "@shared";

const GRAPH_QL = "#GRAPH_QL";
const IMAGE_URL = "/image?url="
const VIDEO_URL = "/video?url="
const IMAGE_PERMALINK_URL = "https://www.instagram.com/p/"
const VIDEO_PERMALINK_URL = "https://www.instagram.com/reel/"

const requestMedia = async (req:IgRequest) : Promise<IgResponse<IMediaResponse>> => {

    const session = getSession(req.headers);

    const access_token = process.env.TOKEN
    const userId = process.env.USER_ID
    const version = process.env.VERSION;
    const username = req.data.username;
    const url = `https://graph.facebook.com/v${version}/${userId}?fields=business_discovery.username(${username}){id,username,name,biography,profile_picture_url,ig_id,media{id,media_url,media_type,permalink,children{id,media_url,media_type,permalink}}}&access_token=${access_token}`;

    try{

        const response = await axios.get(url);
        const data = _formatGraph(response.data);

        return {
            data,
            session
        }

    }catch(ex:any){

        return await _tryRequestPrivate(req, session)

    }

}

const requestMore = async (req:IgRequest) : Promise<IgResponse<IMediaResponse>> => {

    const session = getSession(req.headers);

    if(req.data.next.startsWith(GRAPH_QL)){
        return _tryRequestMorePrivate(req, session);
    }

    const access_token = process.env.TOKEN
    const userId = process.env.USER_ID
    const version = process.env.VERSION;
    const url = `https://graph.facebook.com/v${version}/${userId}?fields=business_discovery.username(${req.data.user.username}){id,username,name,profile_picture_url,ig_id,media.after(${req.data.next}){id,media_url,media_type,permalink,children{id,media_url,media_type,permalink}}}&access_token=${access_token}`;

    const response = await axios.get(url);

    const data = _formatGraph(response.data);

    return {
        data,
        session
    }
}

const _getVideoUrl = (url:string) => {
    return `${VIDEO_URL}${encodeURIComponent(url)}`
}

const _getImageUrl = (url:string) => {
    return `${IMAGE_URL}${encodeURIComponent(url)}`
}

const _formatGraph = (data:any) :IMediaResponse =>{

    const media :IMedia[] = [];

    const root = data.business_discovery;

    root.media.data.forEach( (data:any) => {

        if(data.children){

            data.children.data.forEach((child:any) => {

                const isVideo = child.media_type === "VIDEO"
                const thumbnailUrl = isVideo ? `${IMAGE_URL}${child.permalink}media?size=t` : child.media_url

                media.push({
                    id:child.id,
                    media_url: child.media_url,
                    taggedUsers:[],
                    thumbnail_url: thumbnailUrl,
                    isVideo,
                    permalink: child.permalink
                })
            })

        }else{

            const isVideo = data.media_type === "VIDEO"
            const permalink = isVideo ? data.permalink.replace(/\/reel\//, "/p/") : data.permalink
            const thumbnailUrl = isVideo ? `${IMAGE_URL}${permalink}media?size=t` : data.media_url

            media.push({
                id:data.id,
                media_url: data.media_url,
                taggedUsers:[],
                thumbnail_url: thumbnailUrl,
                isVideo,
                permalink
            })

        }
    })

    const rowIndex = 0;

    const next = root.media.paging ? root.media.paging.cursors.after : "";

    const username = root.username;

    const user :IUser = {
        id: root.ig_id,
        igId: root.ig_id,
        username,
        name: root.name,
        profileImage: root.profile_picture_url,
        biography: root.biography,
        following:false,
        isPro:true,
    }

    const history = {[username]: user}

    return {username, media, user, rowIndex, next, history, isAuthenticated:true};
}


const _tryRequestPrivate = async (req:IgRequest, session:ISession) : Promise<IgResponse<IMediaResponse>> => {

    if(!session.isAuthenticated){
        throw new AuthError("")
    }

    const jar = new CookieStore();
    const username = req.data.username;
    const headers = createHeaders(baseUrl + "/" + username + "/", session);

    try{

        headers["x-ig-app-id"] = session.xHeaders.appId
        headers.Cookie = extractRequestCookie(req.headers.cookie)

        const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`
        const options :AxiosRequestConfig = {
            url,
            method: "GET",
            headers,
        }

        let response = await axios.request(options);

        const userData = response.data.data.user;

        const user :IUser = {
            id: userData.id,
            igId: userData.id,
            username,
            name: userData.full_name,
            profileImage: IMAGE_URL + encodeURIComponent(userData.profile_pic_url),
            biography:userData.biography,
            following:userData.followed_by_viewer,
            isPro:false,
        }

        let cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies)

        response = await _requestPrivate(req, session, user, jar);

        cookies = await jar.getCookies();
        session = updateSession(session, cookies)
        const data = _formatMedia(response.data.data, session, user)

        return {
            data,
            session
        }

    }catch(ex:any){

        const requireLogin = logError(ex);

        if(requireLogin) throw new AuthError("");

        throw new Error("Private media request failed")
    }
}

const _tryRequestMorePrivate = async (req:IgRequest, session:ISession) : Promise<IgResponse<IMediaResponse>> => {

    if(!session.isAuthenticated){
        throw new AuthError("")
    }

    const jar = new CookieStore();

    try{
        const response = await _requestMorePrivate(req, session, jar);
        const cookie = await jar.getCookies();
        session = updateSession(session, cookie)

        const formatResult = _formatMedia(response.data.data, session, req.data.user);

        const data = formatResult;

        return {
            data,
            session
        }

    }catch(ex:any){

        const requireLogin = logError(ex);

        if(requireLogin) throw new AuthError("");

        throw new Error("Private querymore failed")

    }
}

const _requestPrivate = async (req:IgRequest, session:ISession, user:IUser, jar:CookieStore) : Promise<AxiosResponse<any, any>> => {

    const headers = createHeaders(baseUrl + "/" + user.username + "/", session);
    headers.Cookie = await jar.getCookieStrings();

    const params = JSON.stringify({
        id: user.id,
        first:12,
    });

    const url = `https://www.instagram.com/graphql/query/?query_hash=${process.env.QUERY_HASH}&variables=${encodeURIComponent(params)}`

    const options :AxiosRequestConfig = {
        url,
        method: "GET",
        headers,
    }

    const response = await axios.request(options);

    if(response.headers["content-type"].includes("html")){
        throw new Error("Auth error")
    }

    if(!response.data.data){
        throw new Error("Response error")
    }

    await jar.storeCookie(response.headers["set-cookie"])

    return response;

}

const _requestMorePrivate = async (req:IgRequest, session:ISession, jar:CookieStore) : Promise<AxiosResponse<any, any>> => {

    const params = JSON.stringify({
        id:req.data.user.id,
        first:12,
        after:req.data.next.replace(GRAPH_QL, "")
    });

    const url = `https://www.instagram.com/graphql/query/?query_hash=${process.env.QUERY_HASH}&variables=${encodeURIComponent(params)}`

    const headers = createHeaders(baseUrl + "/" + req.data.user.username + "/", session);
    headers.Cookie = extractRequestCookie(req.headers.cookie)

    const options :AxiosRequestConfig = {
        url,
        method: "GET",
        headers,
    }

    const response = await axios.request(options);

    if(response.headers["content-type"].includes("html")){
        throw new Error("Auth error")
    }

    if(!response.data.data){
        throw new Error("Response error")
    }

    await jar.storeCookie(response.headers["set-cookie"])

    return response;

}

const _formatMedia = (data:any, session:ISession, user:IUser) : IMediaResponse => {

    const media :IMedia[] = [];

    const mediaNode = data.user.edge_owner_to_timeline_media;

    mediaNode.edges.forEach( (data:any) => {

        if(data.node.edge_sidecar_to_children){

            data.node.edge_sidecar_to_children.edges.forEach((child:any) =>{

                const isVideo = child.node.is_video
                const mediaUrl = isVideo ? _getVideoUrl(child.node.video_url) : _getImageUrl(child.node.display_url)
                const thumbnail_url = _getImageUrl(child.node.display_url)
                const permalink = isVideo ? `${VIDEO_PERMALINK_URL}${child.node.shortcode}` : `${IMAGE_PERMALINK_URL}${child.node.shortcode}`

                media.push({
                    id:child.node.id,
                    media_url: mediaUrl,
                    taggedUsers: child.node.edge_media_to_tagged_user.edges.map((edge:any) => {
                        return {
                            id:edge.node.user.id,
                            igId:edge.node.user.id,
                            username:edge.node.user.username,
                            name:edge.node.user.full_name,
                            profileImage: _getImageUrl(edge.node.user.profile_pic_url),
                            biography:"",
                        }
                    }),
                    thumbnail_url,
                    isVideo,
                    permalink
                })

            })

        }else{

            const isVideo = data.node.is_video
            const mediaUrl = isVideo ? _getVideoUrl(data.node.video_url) : _getImageUrl(data.node.display_url)
            const thumbnailUrl = isVideo ? _getImageUrl(data.node.thumbnail_src) : mediaUrl
            const permalink = isVideo ? `${VIDEO_PERMALINK_URL}${data.node.shortcode}` : `${IMAGE_PERMALINK_URL}${data.node.shortcode}`

            media.push({
                id:data.node.id,
                media_url: mediaUrl,
                taggedUsers: data.node.edge_media_to_tagged_user.edges.map((edge:any) => {
                    return {
                        id:edge.node.user.id,
                        igId:edge.node.user.id,
                        username:edge.node.user.username,
                        name:edge.node.user.full_name,
                        profileImage: _getImageUrl(edge.node.user.profile_pic_url),
                        biography:"",
                    }
                }),
                thumbnail_url: thumbnailUrl,
                isVideo,
                permalink
            })

        }
    })

    const rowIndex = 0;

    const next = mediaNode.page_info.has_next_page ? GRAPH_QL + mediaNode.page_info.end_cursor : "";

    const username = user.username;

    const history = {[username]: user}

    return {username, media, user, rowIndex, next, history, isAuthenticated: session.isAuthenticated};

}

const downloadMedia = async (url:string) => {

    const options :AxiosRequestConfig = {
        url,
        method: "GET",
        headers:baseRequestHeaders,
        responseType: "stream",
    }

    return await axios.request(options);

}

export {requestMore, requestMedia, downloadMedia}