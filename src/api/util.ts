import { AxiosRequestHeaders, AxiosResponseHeaders } from "axios";
import tough, { CookieJar } from "tough-cookie";

const baseUrl = "https://www.instagram.com"

const IgHeaderNames = {
    appId:"x_app_id",
    ajax:"x_ajax"
}

const Cookie = tough.Cookie;

const baseRequestHeaders :AxiosRequestHeaders = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "en-US",
    "Authority": "www.instagram.com",
}

const getSession = (headers:any) :ISession => {


    try{

        const session :ISession = {
            isAuthenticated:false,
            csrfToken:"",
            userId:"",
            expires: null,
            xHeaders:{appId:"", ajax:""},
            userAgent:headers["user-agent"]
        }

        if(!headers.cookie){
            return session;
        }

        const cookies = headers.cookie.split(";")

        cookies.forEach((cookieString:string) => {

            const cookie = Cookie.parse(cookieString);

            if(!cookie){
                return
            }

            const key = cookie.key.toLowerCase();

            if(key === "sessionid" && cookie.value){

                session.isAuthenticated = true;

                if(cookie.expires !== "Infinity"){
                    session.expires = cookie.expires;
                }

            }

            if(key === "csrftoken"){
                session.csrfToken = cookie.value;
            }

            if(key === "ds_user_id"){
                session.userId = cookie.value;
            }

            if(key === IgHeaderNames.appId.toLowerCase()){
                session.xHeaders.appId = cookie.value;
            }

            if(key === IgHeaderNames.ajax.toLowerCase()){
                session.xHeaders.ajax = cookie.value;
            }

        })

        return session;

    }catch(ex:any){
        console.log(ex.message);
        throw new Error("cookie error")
    }
}

const updateSession = (currentSession:ISession, cookies:tough.Cookie[], xHeaders?:IgHeaders) => {

    const session :ISession = {
        isAuthenticated:currentSession.isAuthenticated,
        csrfToken:currentSession.csrfToken,
        userId:currentSession.userId,
        expires: currentSession.expires,
        xHeaders: xHeaders ?? currentSession.xHeaders,
    }

    cookies.forEach((cookie:tough.Cookie) => {

        if(cookie.key.toLowerCase() === "sessionid" && cookie.value){

            session.isAuthenticated = true;

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

    })

    return session;

}

const createHeaders = (referer:string, session:ISession) :AxiosRequestHeaders => {

    const headers :AxiosRequestHeaders = baseRequestHeaders;
    headers["origin"] = "https://www.instagram.com"
    headers["referer"] = referer
    headers["x-requested-with"] = "XMLHttpRequest"
    headers["X-Csrftoken"] = session.csrfToken;
    headers["X-Asbd-Id"] = 129477
    if(session.userAgent){
        headers["user-agent"] = session.userAgent//"Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
    }

    if(session.xHeaders.ajax){
        headers["X-Instagram-Ajax"] = session.xHeaders.ajax
    }

    if(session.xHeaders.appId){
        headers["X-Ig-App-Id"] = session.xHeaders.appId
    }

    return headers;
}

const getAppId = (data:any) => {
    const appIds = data.match(/"customHeaders":{"X-IG-App-ID":"(.*)","X-IG-D"/)
    return appIds[1]
}

const getClientVersion = (data:any) => {
    const version = data.match(/"client_revision":(.*),"tier"/)
    return version[1]
}

const extractUserId = (data:any) => {
    const userId = data.match(/{"query":{"query_hash":".*","user_id":"(.*)","include_chaining"/)
    return userId[1]
}

const extractCsrfToken = (data:any) => {
    const token = data.match(/{"raw":"{\\"config\\":{\\"csrf_token\\":\\"(.*)\\",\\"viewer\\":/)
    return token[1]
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

const getCookieString = (cookies:string[] | undefined[]) => {

    let setCookieString = "";

    cookies.forEach((cookieString:any) => {

        const cookie = Cookie.parse(cookieString);

        if(!cookie || cookie.value === "" || cookie.value === undefined || cookie.value === null){
            return
        }

        setCookieString += `${cookie.key}=${cookie.value};`

    })

    return setCookieString;
}

class CookieStore{

    jar:tough.CookieJar;
    responseJar:tough.CookieJar;
    url:string;

    constructor(url?:string){
        this.jar = new CookieJar();
        this.responseJar = new CookieJar();
        this.url = url ? url : baseUrl;
    }

    async storeCookie(setCookie:string[] | undefined){

        if(!setCookie){
            return await this.getAllCookies();
        }

        for (const cookieString of setCookie) {
            await this.jar.setCookie(cookieString, this.url, {ignoreError:true});
            await this.responseJar.setCookie(cookieString, this.url, {ignoreError:true});
        }

        return await this.getAllCookies();
    }

    async storeRequestCookie(cookieHeader:string | undefined){

        if(!cookieHeader){
            return await this.getCookies();
        }

        const excludeKeys = [
            "connect.sid",
            "ARRAffinity",
            "ARRAffinitySameSite"
        ]

        if(this.url == baseUrl){
            excludeKeys.push(IgHeaderNames.ajax)
            excludeKeys.push(IgHeaderNames.appId)
        }

        const validCookies = cookieHeader.split(";").map(item => item.trim()).filter(cookieString => !excludeKeys.some(key => cookieString.includes(key)))

        for (const cookieString of validCookies) {
            await this.jar.setCookie(cookieString, this.url, {ignoreError:true});
        }

        return await this.getAllCookies();
    }

    async storeXHeaderCookie(xHeaders:IgHeaders){
        const today = new Date();
        const expires = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        const xAjaxCookie = new tough.Cookie();
        xAjaxCookie.key = IgHeaderNames.ajax;
        xAjaxCookie.value = xHeaders.ajax;
        xAjaxCookie.expires = expires;
        xAjaxCookie.path = "/"
        xAjaxCookie.secure = true;
        xAjaxCookie.domain = this.url
        await this.responseJar.setCookie(xAjaxCookie, this.url, {ignoreError:true});
        const xAppIdCookie = new tough.Cookie();
        xAppIdCookie.key = IgHeaderNames.appId;
        xAppIdCookie.value = xHeaders.appId;
        xAppIdCookie.expires = expires;
        xAppIdCookie.path = "/"
        xAppIdCookie.secure = true;
        xAppIdCookie.domain = this.url
        await this.responseJar.setCookie(xAppIdCookie, this.url, {ignoreError:true});
    }

    async getCookieStrings(){
        return await this.jar.getCookieString(this.url)
    }

    async getCookies(){
        return await this.responseJar.getCookies(this.url);
    }

    private async getAllCookies(){
        return await this.jar.getCookies(this.url);
    }

}

const logError = (ex:any):ErrorDetail => {

    const hasResponse = !!ex.response

    const message = hasResponse ? ex.response.data.message : ex.message;
    let data = hasResponse ? ex.response.data : "No response data";

    if(hasResponse && ex.response.headers["content-type"].includes("html")){
        data = "Response is HTML"
    }

    console.log("----------- Error Logging ----------")
    console.log(`message: ${message}`)
    console.log(`data: ${JSON.stringify(data)}`)
    console.log("------------------------------------")

    return {
        message,
        data,
        requireLogin: hasResponse ? ex.response.data.require_login : false
    }
}

export {baseUrl, baseRequestHeaders, getSession, updateSession, createHeaders, getAppId, getClientVersion, getCookieString, extractToken, CookieStore, logError, extractUserId, extractCsrfToken}