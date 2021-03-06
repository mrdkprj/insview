import axios, { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, AxiosResponseHeaders } from "axios";
import { IMedia, IMediaResponse, IUser, AuthError, ILoginResponse, IFollowing, IgRequest, IgResponse, ISession} from "./src/response";
import tough from "tough-cookie";

const GRAPH_QL = "#GRAPH_QL";
const baseUrl = "https://www.instagram.com"

const baseRequestHeaders :AxiosRequestHeaders = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "en-US",
    "Authority": "www.instagram.com",
}

const Cookie = tough.Cookie;

const getSession = (headers:any) :ISession => {

    console.log("--------- set cookie ----------")

    try{

        const session :ISession = {
            isAuthenticated:false,
            csrfToken:"",
            userId:"",
            userAgent: headers["user-agent"],
            cookies:[],
            expires: null,
        }

        if(!headers.cookie && !headers["set-cookie"]){
            return session;
        }

        let cookies = [];
        if(headers.cookie){
            cookies = headers.cookie.split(";")
        }else{
            cookies = headers["set-cookie"] instanceof Array ? headers["set-cookie"] : [headers["set-cookie"]]
        }

        cookies.forEach((cookieString:string) => {

            const cookie = Cookie.parse(cookieString);

            if(!cookie){
                return
            }

            if(cookie.key.toLowerCase() === "sessionid"){

                session.isAuthenticated = true;

                if(!cookie.expires){
                    const expires = new Date();
                    expires.setTime(expires.getTime() + (8*60*60*1000));
                    cookie.expires = expires
                }


                if(cookie.expires !== "Infinity"){
                    session.expires = cookie.expires;
                }

            }

            if(cookie.key.toLowerCase() === "csrftoken"){
                session.csrfToken = cookie.value;
            }

            if(cookie.key.toLowerCase() === "ds_user_id"){
                session.userId = cookie.value;
            }

            session.cookies.push(cookie);

        })

        return session;

    }catch(ex:any){
        console.log(ex.message);
        throw new Error("cookie error")
    }
}

const updateSession = (currentSession:ISession, headers:any) => {

    const session = currentSession;

    session.cookies = [];

    const cookies = headers["set-cookie"] instanceof Array ? headers["set-cookie"] : [headers["set-cookie"]];

    if(!cookies){
        return session;
    }

    cookies.forEach((cookieString:string) => {

        const cookie = Cookie.parse(cookieString);

        if(!cookie) return;

        session.cookies.push(cookie)

    })

    return session;

}

const createHeaders = (referer:string, session:ISession) :AxiosRequestHeaders => {

    const headers :AxiosRequestHeaders = baseRequestHeaders;
    headers["origin"] = "https://www.instagram.com"
    headers["referer"] = referer
    headers["x-requested-with"] = "XMLHttpRequest"
    headers["x-csrftoken"] = session.csrfToken;
    headers["user-agent"] = session.userAgent;

    return headers;
}

const requestMedia = async (req:IgRequest) : Promise<IgResponse<IMediaResponse>> => {

    const session = getSession(req.headers);

    const access_token = process.env.TOKEN
    const userId = process.env.USER_ID
    const version = process.env.VERSION;
    const username = req.data.username;
    const url = `https://graph.facebook.com/v${version}/${userId}?fields=business_discovery.username(${username}){id,username,name,biography,profile_picture_url,ig_id,media{id,media_url,media_type,children{id,media_url,media_type}}}&access_token=${access_token}`;

    try{

        const response = await axios.get(url);
        const data = formatMedia(response.data);

        return {
            data,
            session
        }

    }catch(ex:any){

        return await tryRequestGraph(req, session)

    }

}

const tryRequestGraph = async (req:IgRequest, currentSession:ISession) : Promise<IgResponse<IMediaResponse>> => {

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

        const title = pageResponse.data.match(/<title>(.*)\(&#064;(.*)\).*<\/title>/);
        const profile = pageResponse.data.match(/"props":{"id":"([0-9]*)".*"profile_pic_url":"(.*)","show_suggested_profiles"/);

        const user :IUser = {
            id: profile[1],
            igId: profile[1],
            username,
            name: title[1],
            profileImage: decodeURIComponent(profile[2]),
            biography:"",
        }

        const requestSession = updateSession(currentSession, pageResponse.headers)

        const response = await requestGraph(req, requestSession, user);
        const session = updateSession(currentSession, response.headers)
        const data = formatGraph(response.data.data, session, user)

        return {
            data,
            session
        }

    }catch(ex:any){
        console.log(ex.message)
        throw new Error("User not found")
    }
}

const requestMore = async (req:IgRequest) : Promise<IgResponse<IMediaResponse>> => {

    const session = getSession(req.headers);

    if(req.data.next.startsWith(GRAPH_QL)){
        return tryRequestMoreGraph(req, session);
    }

    const access_token = process.env.TOKEN
    const userId = process.env.USER_ID
    const version = process.env.VERSION;
    const url = `https://graph.facebook.com/v${version}/${userId}?fields=business_discovery.username(${req.data.user.username}){id,username,name,profile_picture_url,ig_id,media.after(${req.data.next}){id,media_url,media_type,children{id,media_url,media_type}}}&access_token=${access_token}`;

    const response = await axios.get(url);

    const data = formatMedia(response.data);

    return {
        data,
        session
    }
}

const tryRequestMoreGraph = async (req:IgRequest, currentSession:ISession) : Promise<IgResponse<IMediaResponse>> => {

    if(!currentSession.isAuthenticated){
        throw new AuthError("")
    }

    const response = await requestMoreByGraphql(req, currentSession);
    const session = updateSession(currentSession, response.headers)

    const formatResult = formatGraph(response.data.data, session, req.data.user);

    const data = formatResult;

    return {
        data,
        session
    }
}

const formatMedia = (data:any) :IMediaResponse =>{

    const media :IMedia[] = [];

    const root = data.business_discovery;

    root.media.data.filter( (data:any) => data.media_type !== "VIDEO").forEach( (data:any) => {

        if(data.children){

            data.children.data.filter((data:any) => data.media_type !== "VIDEO").forEach((data:any) =>{
                media.push({
                    id:data.id,
                    media_url: data.media_url
                })
            })

        }else{

            media.push({
                id:data.id,
                media_url: data.media_url
            })

        }
    })

    const rowIndex = 0;

    let next = null;
    if(root.media.paging){
        next = root.media.paging.cursors.after;
    }

    const username = root.username;

    const user :IUser = {
        id: root.id,
        igId: root.ig_id,
        username,
        name: root.name,
        profileImage: root.profile_picture_url,
        biography: root.biography,
    }

    const history = {[username]: user}

    return {username, media, user, rowIndex, next, history, isAuthenticated:true};
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

const requestGraph = async (req:IgRequest, session:ISession, user:IUser) : Promise<AxiosResponse<any, any>> => {
/*
    const username = req.data.username;
    const rhx_gis = "51383432";
    const gis = crypto.createHash("md5").update(`${rhx_gis}:/${username}/`).digest("hex")

    //const headers = createHeaders(baseUrl + "/" + username + "/", session);
    //headers["x-instagram-gis"] = gis;
    const headers :AxiosRequestHeaders = baseRequestHeaders;
    headers["origin"] = "https://www.instagram.com"
    headers["referer"] = "https://www.instagram.com/"
    headers["x-csrftoken"] = session.csrfToken;
    headers["user-agent"] = session.userAgent;

    headers.Cookie = req.headers.cookie ?? "";

    let url = `${baseUrl}/${username}/?__a=1`;
    url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=1492agjmd03`

    const options :AxiosRequestConfig = {
        url,
        method: "GET",
        headers,
        withCredentials:true
    }

    const response = await axios.request(options);

    if(response.headers["content-type"].includes("html")){
        console.log("auth error")
        throw new Error("Auth error")
    }


    return response.data;
*/

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

const requestMoreByGraphql = async (req:IgRequest, session:ISession) : Promise<AxiosResponse<any, any>> => {

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

const formatGraph = (data:any, session:ISession, user:IUser) : IMediaResponse => {

    const media :IMedia[] = [];

    const mediaNode = data.user.edge_owner_to_timeline_media;

    mediaNode.edges.filter( (data:any) => data.node.is_video === false).forEach( (data:any) => {

        if(data.node.edge_sidecar_to_children){

            data.node.edge_sidecar_to_children.edges.filter((data:any) => data.node.is_video === false).forEach((data:any) =>{
                media.push({
                    id:data.node.id,
                    media_url: "/media?url=" + data.node.display_url
                })
            })

        }else{

            media.push({
                id:data.node.id,
                media_url: "/media?url=" + data.node.display_url
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

const requestFollowings = async (req:IgRequest) : Promise<IgResponse<IFollowing>> => {

    const currentSession = getSession(req.headers);

    const params = req.data.next ? {
        id: currentSession.userId,
        first:20,
        after: req.data.next
    } : {
        id: currentSession.userId,
        first:20
    }

    const url = `https://www.instagram.com/graphql/query/?query_hash=58712303d941c6855d4e888c5f0cd22f&variables=${encodeURIComponent(JSON.stringify(params))}`

    const headers = createHeaders(baseUrl, currentSession);
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

    const data = formatFollowings(response.data);
    const session = updateSession(currentSession, response.headers);

    return {
        data,
        session
    }
}

const formatFollowings = (data:any) :IFollowing => {

    const dataNode = data.data.user.edge_follow;

    const users :IUser[] = dataNode.edges.map((user:any) => {
        return {
            id:user.node.id,
            igId:user.node.id,
            username:user.node.username,
            name:user.node.full_name,
            profileImage: "/media?url=" + user.node.profile_pic_url
        }
    })

    const hasNext = dataNode.page_info.has_next_page;
    const next = hasNext ? dataNode.page_info.end_cursor : "";

    return {users, hasNext, next};

}

const extractToken = (headers:AxiosResponseHeaders) => {

    const setCookieHeader = headers["set-cookie"] || [];

    const cookies :tough.Cookie[] = setCookieHeader.map(c => Cookie.parse(c) || new tough.Cookie());

    const { value: csrftoken } = cookies.find(({ key }) => key === "csrftoken") || {}

    if(!csrftoken){
        return "";
    }

    return csrftoken;
}

const login = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    console.log("----------try login----------")

    const account = req.data.account;

    let session = getSession(req.headers);

    let headers = baseRequestHeaders;
    headers["user-agent"] = session.userAgent

    let options :AxiosRequestConfig= {
        url: baseUrl,
        method: "GET",
        headers,
        withCredentials:true
    };

    try{

        headers.Cookie = "ig_cb=1;"

        let rolloutHash = 1;
        headers["x-instagram-ajax"] = rolloutHash;

        const baseResult = await axios.request(options);

        const baseCsrftoken = extractToken(baseResult.headers)

        if(!baseCsrftoken){
            throw new Error("Token not found")
        }

        const sharedData = JSON.parse(baseResult.data.match(/<script type="text\/javascript">window\._sharedData = (.*)<\/script>/)[1].slice(0, -1));
        rolloutHash = sharedData.rollout_hash;

        headers["x-requested-with"] = "XMLHttpRequest"
        headers["x-csrftoken"] = baseCsrftoken;
        headers["x-instagram-ajax"] = rolloutHash;
        headers["content-type"] = "application/x-www-form-urlencoded"

        const createEncPassword = (pwd:string) => {
            return `#PWD_INSTAGRAM_BROWSER:0:${Math.floor(Date.now() / 1000)}:${pwd}`
        }

        const params = new URLSearchParams();
        params.append("username", account)
        params.append("enc_password", createEncPassword(req.data.password))
        params.append("queryParams", "{}")
        params.append("optIntoOneTap", "false")

        options.url = "https://www.instagram.com/accounts/login/ajax/";
        options.method = "POST"
        options.data = params;
        options.headers = headers;

        const authResponse = await axios.request(options);

        console.log("----------auth response-------")
        console.log(authResponse.data)

        session = getSession(authResponse.headers);
        const data = {account, success:session.isAuthenticated, challenge:false, endpoint:""};

        return {
            data,
            session
        }

    }catch(ex:any){

        if(ex.response && ex.response.data.message && ex.response.data.message === "checkpoint_required"){
            return await requestChallenge(account, options, ex.response)
        }

        console.log("Login failed")

        if(ex.response){
            console.log(ex.response.data)
        }else{
            console.log(ex.message)
        }

        throw new Error("Login failed")
    }
}

const requestChallenge = async (account:string, options:AxiosRequestConfig, res:AxiosResponse<any, any>) :Promise<IgResponse<ILoginResponse>> => {

    console.log("---------- challenge start -------")

    if(!options.headers){
        throw new Error("headers empty");
    }

    const resToken = extractToken(res.headers);

    options.headers["x-csrftoken"] = resToken;

    const responseCookies = res.headers["set-cookie"] instanceof Array ? res.headers["set-cookie"] : [res.headers["set-cookie"]]

    let requestCookies :string = "";

    responseCookies.forEach((cookieString:any) => {

        const cookie = Cookie.parse(cookieString);

        if(!cookie){
            return
        }

        requestCookies += `${cookie.key}=${cookie.value};`

    })

    options.headers.Cookie = requestCookies;

    const url = baseUrl + res.data.checkpoint_url;
    options.url = url;
    options.method = "GET"
    options.data = "";

    await axios.request(options)

    console.log("---------- challenge post start -------")

    const params = new URLSearchParams();
    params.append("choice", "1")
    options.data = params;
    options.method = "POST"

    const nextRes = await axios.request(options)

    const session = getSession(res.headers);

    if(nextRes.data.type && nextRes.data.type === "CHALLENGE"){

        return {
            data:{account:account, success:false, challenge: true, endpoint:url},
            session
        }
    }

    return {
        data:{account, success:false, challenge: false, endpoint: ""},
        session
    }

}

const challenge = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    const currentSession = getSession(req.headers);

    try{

        const url = req.data.endpoint;

        const headers = createHeaders(url, currentSession);
        headers.Cookie = req.headers.cookie ?? "";
        headers["x-requested-with"] = "XMLHttpRequest"
        headers["content-type"] = "application/x-www-form-urlencoded"

        const params = new URLSearchParams();
        params.append("security_code", req.data.code)

        const options :AxiosRequestConfig = {
            url,
            method: "POST",
            headers,
            data: params,
            withCredentials:true
        }

        const response = await axios.request(options);

        console.log(response.data)

        const session = getSession(response.headers);
        const data = {account:req.data.account, success:session.isAuthenticated, challenge:!session.isAuthenticated, endpoint:""};

        return {
            data,
            session
        }

    }catch(ex:any){
        return {
            data:{account:req.data.account, success:false, challenge:true, endpoint:req.data.endpoint},
            session: currentSession
        }
    }

}

const logout = async (req:IgRequest) => {

    const session = getSession(req.headers);
    if(!session.isAuthenticated){
        return;
    }

    const headers = createHeaders(baseUrl, session);
    headers.Cookie = req.headers.cookie ?? "";

    const options :AxiosRequestConfig = {
        url: `${baseUrl}/accounts/logout/ajax/`,
        method: "POST",
        headers,
        withCredentials:true
    }

    await axios.request(options);
}

const follow = async (req:IgRequest) => {

    const currentSession = getSession(req.headers);

    if(!currentSession.isAuthenticated){
        throw new AuthError("")
    }

    const url = `${baseUrl}/web/friendships/${req.data.user.id}/follow/`

    const headers = createHeaders(baseUrl, currentSession);
    headers.Cookie = req.headers.cookie ?? "";

    const options :AxiosRequestConfig = {
        url,
        method: "POST",
        headers,
        withCredentials:true
    }

    const response = await axios.request(options);

    const data = response.data;
    const session = updateSession(currentSession, response.headers);

    return {
        data,
        session
    }
}

const unfollow = async (req:IgRequest) => {

    const currentSession = getSession(req.headers);

    if(!currentSession.isAuthenticated){
        throw new AuthError("")
    }

    const url = `${baseUrl}/web/friendships/${req.data.user.id}/unfollow/`

    const headers = createHeaders(baseUrl, currentSession);
    headers.Cookie = req.headers.cookie ?? "";

    const options :AxiosRequestConfig = {
        url,
        method: "POST",
        headers,
        withCredentials:true
    }

    const response = await axios.request(options);

    const data = response.data;
    const session = updateSession(currentSession, response.headers);

    return {
        data,
        session
    }
}

export {login, challenge, logout, requestMore, requestMedia, requestImage, requestFollowings, getSession, follow, unfollow}

/*
  async _getFollowData({ fieldName, queryHash, variables }) {
    return this.request("/graphql/query/", {
      qs: {
        query_hash: queryHash,
        variables: JSON.stringify(variables)
      }
    })
      .then(data => data.data.user[fieldName])
      .then(({ count, page_info, edges }) => ({
        count,
        page_info,
        data: edges.map(edge => edge.node)
      }))
  }

  async getFollowers({ userId, first = 20, after }) {
    return this._getFollowData({
      fieldName: "edge_followed_by",
      queryHash: "37479f2b8209594dde7facb0d904896a",
      variables: {
        id: userId,
        first,
        after
      }
    })
  }

  async getFollowings({ userId, first = 20, after }) {
    return this._getFollowData({
      fieldName: "edge_follow",
      queryHash: "58712303d941c6855d4e888c5f0cd22f",
      variables: {
        id: userId,
        first,
        after
      }
    })
  }
  */