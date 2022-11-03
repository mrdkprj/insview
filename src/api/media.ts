import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {baseUrl, baseRequestHeaders, getSession, updateSession, createHeaders, getAppId} from "./util"
import { IMedia, IMediaResponse, IUser, IgRequest, IgResponse, ISession, AuthError} from "@shared";

const GRAPH_QL = "#GRAPH_QL";

const requestMedia = async (req:IgRequest) : Promise<IgResponse<IMediaResponse>> => {

    const session = getSession(req.headers);

    const access_token = process.env.TOKEN
    const userId = process.env.USER_ID
    const version = process.env.VERSION;
    const username = req.data.username;
    const url = `https://graph.facebook.com/v${version}/${userId}?fields=business_discovery.username(${username}){id,username,name,biography,profile_picture_url,ig_id,media{id,media_url,media_type,children{id,media_url,media_type}}}&access_token=${access_token}`;

    try{

        const response = await axios.get(url);
        const data = _formatMedia(response.data);

        return {
            data,
            session
        }

    }catch(ex:any){

        return await _tryRequestGraph(req, session)

    }

}

const requestMore = async (req:IgRequest) : Promise<IgResponse<IMediaResponse>> => {

    const session = getSession(req.headers);

    if(req.data.next.startsWith(GRAPH_QL)){
        return _tryRequestMoreGraph(req, session);
    }

    const access_token = process.env.TOKEN
    const userId = process.env.USER_ID
    const version = process.env.VERSION;
    const url = `https://graph.facebook.com/v${version}/${userId}?fields=business_discovery.username(${req.data.user.username}){id,username,name,profile_picture_url,ig_id,media.after(${req.data.next}){id,media_url,media_type,children{id,media_url,media_type}}}&access_token=${access_token}`;

    const response = await axios.get(url);

    const data = _formatMedia(response.data);

    return {
        data,
        session
    }
}

const _formatMedia = (data:any) :IMediaResponse =>{

    const media :IMedia[] = [];

    const root = data.business_discovery;

    root.media.data.forEach( (data:any) => {

        if(data.children){

            data.children.data.forEach((data:any) =>{
                media.push({
                    id:data.id,
                    media_url: data.media_url,
                    taggedUsers:[],
                    thumbnail_url: data.thumbnail_url,
                    isVideo: data.media_type === "VIDEO"
                })
            })

        }else{

            media.push({
                id:data.id,
                media_url: data.media_url,
                taggedUsers:[],
                thumbnail_url: data.thumbnail_url,
                isVideo: data.media_type === "VIDEO"
            })

        }
    })

    const rowIndex = 0;

    let next = "";
    if(root.media.paging){
        next = root.media.paging.cursors.after;
    }

    const username = root.username;

    const user :IUser = {
        id: root.ig_id,
        igId: root.ig_id,
        username,
        name: root.name,
        profileImage: root.profile_picture_url,
        biography: root.biography,
        following:false,
    }

    const history = {[username]: user}

    return {username, media, user, rowIndex, next, history, isAuthenticated:true};
}


const _tryRequestGraph = async (req:IgRequest, currentSession:ISession) : Promise<IgResponse<IMediaResponse>> => {

    if(!currentSession.isAuthenticated){
        throw new AuthError("")
    }

    try{

        const username = req.data.username;
        const pageHeaders = createHeaders(baseUrl + "/" + username + "/", currentSession);
        pageHeaders.Cookie = req.headers.cookie ?? "";

        const pageUrl = `${baseUrl}/${username}/`
        const options :AxiosRequestConfig = {
            url:pageUrl,
            method: "GET",
            headers:pageHeaders,
            withCredentials:true
        }

        const pageResponse = await axios.request(options);

        /*
        const title = pageResponse.data.match(/<title>(.*)\(&#064;(.*)\).*<\/title>/);
        const profile = pageResponse.data.match(/"props":{"id":"([0-9]*)".*"profile_pic_url":"(.*)","show_suggested_profiles"/);
        */
        const profileSession = updateSession(currentSession, pageResponse.headers)
        const profileHeaders = createHeaders(baseUrl + "/" + username + "/", profileSession);
        profileHeaders["x-ig-app-id"] = getAppId(pageResponse.data)
        profileHeaders.Cookie = req.headers.cookie ?? "";

        const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`
        const profileOptions :AxiosRequestConfig = {
            url,
            method: "GET",
            headers:pageHeaders,
            withCredentials:true
        }

        const profileResponse = await axios.request(profileOptions);

        const userData = profileResponse.data.data.user;

        const user :IUser = {
            id: userData.id,
            igId: userData.id,
            username,
            name: userData.full_name,
            profileImage: "/image?url=" + encodeURIComponent(userData.profile_pic_url),
            biography:userData.biography,
            following:userData.followed_by_viewer,
        }

        const requestSession = updateSession(currentSession, pageResponse.headers)

        const response = await _requestGraph(req, requestSession, user);
        const session = updateSession(currentSession, response.headers)
        const data = _formatGraph(response.data.data, session, user)

        return {
            data,
            session
        }

    }catch(ex:any){
        console.log(ex.message)
        throw new Error("User not found")
    }
}


const _tryRequestMoreGraph = async (req:IgRequest, currentSession:ISession) : Promise<IgResponse<IMediaResponse>> => {

    if(!currentSession.isAuthenticated){
        throw new AuthError("")
    }

    const response = await _requestMoreByGraphql(req, currentSession);
    const session = updateSession(currentSession, response.headers)

    const formatResult = _formatGraph(response.data.data, session, req.data.user);

    const data = formatResult;

    return {
        data,
        session
    }
}


const _requestGraph = async (req:IgRequest, session:ISession, user:IUser) : Promise<AxiosResponse<any, any>> => {

    const headers = createHeaders(baseUrl + "/" + user.username + "/", session);
    headers.Cookie = req.headers.cookie ?? "";

    const params = JSON.stringify({
        id: user.id,
        first:12,
    });

    const url = `https://www.instagram.com/graphql/query/?query_hash=${process.env.QUERY_HASH}&variables=${encodeURIComponent(params)}`

    const options :AxiosRequestConfig = {
        url,
        method: "GET",
        headers,
        withCredentials:true
    }

    const response = await axios.request(options);

    if(response.headers["content-type"].includes("html")){
        throw new Error("Auth error")
    }

    if(!response.data.data){
        throw new Error("Response error")
    }

    return response;
}

const _requestMoreByGraphql = async (req:IgRequest, session:ISession) : Promise<AxiosResponse<any, any>> => {

    const params = JSON.stringify({
        id:req.data.user.id,
        first:12,
        after:req.data.next.replace(GRAPH_QL, "")
    });

    const url = `https://www.instagram.com/graphql/query/?query_hash=${process.env.QUERY_HASH}&variables=${encodeURIComponent(params)}`

    const headers = createHeaders(baseUrl + "/" + req.data.user.username + "/", session);
    headers.Cookie = req.headers.cookie ?? "";

    const options :AxiosRequestConfig = {
        url,
        method: "GET",
        headers,
        withCredentials:true
    }

    const response = await axios.request(options);

    if(response.headers["content-type"].includes("html")){
        throw new Error("Auth error")
    }

    if(!response.data.data){
        throw new Error("Response error")
    }

    return response;

}

const _formatGraph = (data:any, session:ISession, user:IUser) : IMediaResponse => {

    const media :IMedia[] = [];

    const mediaNode = data.user.edge_owner_to_timeline_media;

    mediaNode.edges.forEach( (data:any) => {

        if(data.node.edge_sidecar_to_children){

            data.node.edge_sidecar_to_children.edges.forEach((crData:any) =>{

                const isVideo = crData.node.is_video
                const mediaUrl = isVideo ? "/video?url=" : "/image?url="
                const thumbnail_url = isVideo ? "/image?url=" + encodeURIComponent(data.node.thumbnail_src) : undefined

                media.push({
                    id:crData.node.id,
                    media_url: mediaUrl + encodeURIComponent(crData.node.display_url),
                    taggedUsers: crData.node.edge_media_to_tagged_user.edges.map((edge:any) => {
                        return {
                            id:edge.node.user.id,
                            igId:edge.node.user.id,
                            username:edge.node.user.username,
                            name:edge.node.user.full_name,
                            profileImage: "/image?url=" + encodeURIComponent(edge.node.user.profile_pic_url),
                            biography:"",
                        }
                    }),
                    thumbnail_url,
                    isVideo
                })

            })

        }else{

            const isVideo = data.node.is_video
            const mediaUrl = isVideo ? "/video?url=" : "/image?url="

            media.push({
                id:data.node.id,
                media_url: mediaUrl + encodeURIComponent(data.node.display_url),
                taggedUsers: data.node.edge_media_to_tagged_user.edges.map((edge:any) => {
                    return {
                        id:edge.node.user.id,
                        igId:edge.node.user.id,
                        username:edge.node.user.username,
                        name:edge.node.user.full_name,
                        profileImage: "/image?url=" + encodeURIComponent(edge.node.user.profile_pic_url),
                        biography:"",
                    }
                }),
                thumbnail_url: data.node.thumbnail_src ? "/image?url=" + encodeURIComponent(data.node.thumbnail_src) : undefined,
                isVideo
            })

        }
    })

    const rowIndex = 0;

    let next = "";
    if(mediaNode.page_info.has_next_page){
        next = GRAPH_QL + mediaNode.page_info.end_cursor;
    }

    const username = user.username;

    const history = {[username]: user}

    return {username, media, user, rowIndex, next, history, isAuthenticated: session.isAuthenticated};

}

const requestVideo = async (url:string) => {

    const options :AxiosRequestConfig = {
        url,
        method: "GET",
        headers:baseRequestHeaders,
        responseType: "stream",
        withCredentials:true
    }

    return await axios.request(options);

}

const requestImage = async (url:string) => {

    const options :AxiosRequestConfig = {
        url,
        method: "GET",
        headers:baseRequestHeaders,
        responseType: "stream",
        withCredentials:true
    }

    return await axios.request(options);

}

export {requestMore, requestMedia, requestImage, requestVideo}