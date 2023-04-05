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

const testgetSession = (headers:any) :ISession => {


    try{

        const session :ISession = {
            isAuthenticated:false,
            csrfToken:"",
            userId:"",
            userAgent: headers["user-agent"],
            cookies:[],
            expires: null,
            xHeaders:{appId:"", ajax:""}
        }
        const raw = headers.cookie.split(";")
        const csr = 'ds_user_id=52714401302; ig_nrcb=1; x_app_id=1217981644879628; shbid="15034\\05452714401302\\0541712195954:01f7931a8b0d8dc4d30c957fa7ace0a9b50b2638b19a86c3b81f3f78420ebcd04cc6c0a0"; shbts="1680659954\\05452714401302\\0541712195954:01f79414060218a7aa5ff9f6de1f113b1143acdad97ef3b0291ced0d17ee50e89cc2debd"; x_ajax=1007248582; mid=ZC0dFAAAAAFlb-H1ejriRkECJYwD; ig_did=806A8103-7A23-4196-881D-1892E5FD0E41; sessionid=52714401302%3AUkASXPHheJJ6XI%3A24%3AAYemykVpBE2GUdhj93xXB_hbXw7ZcwDm6klVQpz6Pg; rur="EAG\\05452714401302\\0541712215459:01f73254288bfade4ee70b196d8dbaea53ed87343d01d27ccd60e0340ad6274a0f594922"'
        const cs = csr.split(";").filter(e => !raw.includes(e))
        const cookies = cs

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

const getSession = (headers:any) :ISession => {


    try{

        const session :ISession = {
            isAuthenticated:false,
            csrfToken:"",
            userId:"",
            userAgent: headers["user-agent"],
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
        userAgent: currentSession.userAgent,
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
/*
const updateSession = (currentSession:ISession, headers:any) => {

    currentSession.cookies = [];

    const cookies = headers["set-cookie"] instanceof Array ? headers["set-cookie"] : [headers["set-cookie"]];

    cookies.forEach((cookieString:string) => {

        const cookie = Cookie.parse(cookieString);

        if(!cookie) return;

        currentSession.cookies.push(cookie)

    })

    return currentSession;

}
*/

const createHeaders = (referer:string, session:ISession) :AxiosRequestHeaders => {

    const headers :AxiosRequestHeaders = baseRequestHeaders;
    headers["origin"] = "https://www.instagram.com"
    headers["referer"] = referer
    headers["x-requested-with"] = "XMLHttpRequest"
    headers["x-csrftoken"] = session.csrfToken;
    headers["user-agent"] = session.userAgent;

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

const extractRequestCookie = (cookieStrings:string | undefined) => {

    if(!cookieStrings) return "";

    const excludeKeys = ["connect.sid", IgHeaderNames.ajax, IgHeaderNames.appId]

    const validCookies = cookieStrings.split(";").filter(cookieString => !excludeKeys.some(key => cookieString.includes(key)))

    return validCookies.join(";")
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

    async storeCookieByTough(setCookie:tough.Cookie[] | undefined){

        if(!setCookie){
            return await this.getCookies();
        }

        for (const cookieString of setCookie) {
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

    if(ex.response && ex.response.headers["content-type"].includes("html")){
        return false;
    }

    const errorData = ex.response ? ex.response.data : ex;
    console.log(errorData)
    console.log(errorData.message)

    if(ex.response && ex.response.data){
        //return ex.response.data.require_login
        return false
    }

    return false
}

export {baseUrl, baseRequestHeaders, getSession, updateSession, createHeaders, getAppId, getClientVersion, extractRequestCookie, getCookieString, extractToken, updateCookie, CookieStore, logError, testgetSession}