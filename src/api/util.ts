import { AxiosRequestHeaders, AxiosResponseHeaders } from "axios";
import tough from "tough-cookie";
import { ISession } from "@shared";

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
            userAgent: headers["user-agent"],
            cookies:[],
            expires: null,
        }

        if(!headers.cookie && !headers["set-cookie"]){
            return session;
        }

        let cookies:any = [];
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

const getAppId = (data:any) => {
    const appIds = data.match(/"customHeaders":{"X-IG-App-ID":"(.*)","X-IG-D"/)
    return appIds[1]
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

        if(!cookie){
            return
        }

        setCookieString += `${cookie.key}=${cookie.value};`

    })

    return setCookieString;
}

export {baseUrl, baseRequestHeaders, getSession, updateSession, createHeaders, getAppId, getCookieString, extractToken}