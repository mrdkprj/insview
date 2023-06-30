import { AxiosRequestHeaders, AxiosResponseHeaders } from "axios";
import tough, { CookieJar } from "tough-cookie";
import { IgHeaders, ISession, IgHeaderNames } from "@shared";

const baseUrl = "https://www.instagram.com"

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
            cookies:[],
            expires: null,
            xHeaders:{appId:"", ajax:""}
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

                if(!cookie.expires){
                    const expires = new Date();
                    expires.setTime(expires.getTime() + (8*60*60*1000));
                    cookie.expires = expires
                }


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

            session.cookies.push(cookie);

        })

        return session;

    }catch(ex:any){
        console.log(ex.message);
        throw new Error("cookie error")
    }
}

const updateSession = (currentSession:ISession, cookies:tough.Cookie[], xHeaders?:IgHeaders) => {

    const session :ISession = {
        isAuthenticated:false,
        csrfToken:currentSession.csrfToken,
        userId:currentSession.userId,
        cookies:[],
        expires: currentSession.expires,
        xHeaders: xHeaders ?? currentSession.xHeaders,
    }

    const updatedCookies:{[key:string]:tough.Cookie} = {}

    currentSession.cookies.forEach(cookie => updatedCookies[cookie.key] = cookie)

    cookies.forEach(cookie => updatedCookies[cookie.key] = cookie);

    if(xHeaders){
        const today = new Date();
        const expires = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        const xAjaxCookie = new tough.Cookie();
        xAjaxCookie.key = IgHeaderNames.ajax;
        xAjaxCookie.value = xHeaders.ajax;
        xAjaxCookie.expires = expires;
        xAjaxCookie.path = "/"
        xAjaxCookie.secure = true;
        xAjaxCookie.maxAge = 31449600;
        updatedCookies[xAjaxCookie.key] = xAjaxCookie
        const xAppIdCookie = new tough.Cookie();
        xAppIdCookie.key = IgHeaderNames.appId;
        xAppIdCookie.value = xHeaders.appId;
        xAppIdCookie.expires = expires;
        xAppIdCookie.path = "/"
        xAppIdCookie.secure = true;
        xAppIdCookie.maxAge = 31449600;
        updatedCookies[xAppIdCookie.key] = xAppIdCookie
    }

    Object.values(updatedCookies).forEach((cookie:tough.Cookie) => {

        if(cookie.key.toLowerCase() === "sessionid" && cookie.value){

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

}

const getTest = () => {

    const cs:tough.Cookie[] = [];

    let c = new Cookie(
        {
            key: 'x_ajax',
            value: '1007776100',
            domain: '',
            expires: new Date("2024-06-29T15:00:00.000Z"),
            httpOnly: false,
            path: '/',
            secure: true,
            sameSite: 'none'
        }
    )

    cs.push(c)

    c = new Cookie({
        key: 'x_app_id',
        value: '1217981644879628',
          domain: '',
          expires: new Date("2024-06-29T15:00:00.000Z"),
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none'
    })

    cs.push(c);

    c = new Cookie({
        key: 'csrftoken',
        value: 'cmOmrxZietAml4MGy4ce2DZQvf8BPg4I',
          domain: '',
          expires: new Date("2024-06-28T07:45:28.000Z"),
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none'
    })

    cs.push(c);

    c = new Cookie({
        key: 'rur',
        value: '"NHA\\05452714401302\\0541719647128:01f7c504e48123eb833a5fbe89ec38935ca23bc955b3fd12bb3d6dce3139fe9812b6d366"',
          domain: '',
          expires: undefined,
          httpOnly: true,
          path: '/',
          secure: true,
          sameSite: 'lax'
    })

    cs.push(c);

    c = new Cookie({
        key: 'mid',
        value: 'ZJ6IFgAAAAEYon2xLqeWPnwRjGvl',
          domain: '',
          expires: new Date("2025-06-29T07:45:28.000Z"),
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none'
    })

    cs.push(c);

    c = new Cookie({
        key: 'ds_user_id',
        value: '52714401302',
          domain: '',
          expires: new Date("2023-09-28T07:45:28.000Z"),
          httpOnly: false,
          path: '/',
          secure: true,
          sameSite: 'none'
    })

    cs.push(c);

    c = new Cookie({
        key: 'ig_did',
        value: 'D25FDD79-ACAC-4BB1-9BB6-326367D1B22F',
          domain: '',
          expires: new Date("2025-06-29T07:45:28.000Z"),
          httpOnly: true,
          path: '/',
          secure: true,
          sameSite: 'none'
    })

    cs.push(c);

    c = new Cookie({
        key: 'sessionid',
        value: process.env.SF_TEST,
          domain: '',
          expires: new Date("2024-06-29T07:45:28.000Z"),
          httpOnly: true,
          path: '/',
          secure: true,
          sameSite: 'none'
    })

    cs.push(c);

    return cs;

}

const createHeaders = (referer:string, session:ISession) :AxiosRequestHeaders => {

    const headers :AxiosRequestHeaders = baseRequestHeaders;
    headers["origin"] = "https://www.instagram.com"
    headers["referer"] = referer
    headers["x-requested-with"] = "XMLHttpRequest"
    headers["x-csrftoken"] = session.csrfToken;
    if(session.userAgent){
        headers["user-agent"] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/113.0.5672.69 Mobile/15E148 Safari/604.1'//session.userAgent
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
    //{"raw":"{\"config\":{\"csrf_token\":\"FDLgSfTPUrTDsYHfIoapicYTDCL9JjHH\",\"viewer\":null,\"
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

const updateCookie = (old:string[] | undefined[], cs:string[] | undefined[]) => {

    const cookies:{[key:string]:any} = {}

    old.forEach((c:any) => {
        const cookie = Cookie.parse(c);

        if(!cookie || cookie.value === "" || cookie.value === undefined || cookie.value === null){
            return
        }

        cookies[cookie.key] = cookie.value;
    })

    cs.forEach((cookieString:any) => {

        const cookie = Cookie.parse(cookieString);

        if(!cookie || cookie.value === "" || cookie.value === undefined || cookie.value === null){
            return
        }

        cookies[cookie.key] = cookie.value;

    })

    let setCookieString = "";

    Object.keys(cookies).forEach((k:any) => {

        setCookieString += `${k}=${cookies[k]};`

    })

    return setCookieString;
}

class CookieStore{

    jar:tough.CookieJar;

    constructor(){
        this.jar = new CookieJar();
    }

    async storeCookie(setCookie:string[] | undefined){

        if(!setCookie){
            return await this.getCookies();
        }

        for (const cookieString of setCookie) {
            await this.jar.setCookie(cookieString, baseUrl, {ignoreError:true});
        }

        return await this.getCookies();
    }

    async storeRequestCookie(cookieHeader:string | undefined){

        if(!cookieHeader){
            return await this.getCookies();
        }

        const excludeKeys = [
            "connect.sid",
            "ARRAffinity",
            "ARRAffinitySameSite",
            IgHeaderNames.ajax,
            IgHeaderNames.appId
        ]

        const validCookies = cookieHeader.split(";").map(item => item.trim()).filter(cookieString => !excludeKeys.some(key => cookieString.includes(key)))

        for (const cookieString of validCookies) {
            await this.jar.setCookie(cookieString, baseUrl, {ignoreError:true});
        }

        return await this.getCookies();
    }

    async getCookieStrings(){
        return await this.jar.getCookieString(baseUrl)
    }

    async getCookies(){
        return await this.jar.getCookies(baseUrl);
    }

}

const logError = (ex:any) => {

    const errorData = ex.response ? ex.response.data : ex;

    if(ex.response && !ex.response.headers["content-type"].includes("html")){
        console.log(errorData)
    }
    console.log(errorData.message)

    if(ex.response && ex.response.data){
       return ex.response.data.require_login
    }

    return false
}

export {baseUrl, baseRequestHeaders, getSession, updateSession, createHeaders, getAppId, getClientVersion, getCookieString, extractToken, updateCookie, CookieStore, logError, extractUserId, extractCsrfToken, getTest}