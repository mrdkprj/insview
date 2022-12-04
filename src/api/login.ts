import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { baseRequestHeaders, baseUrl, createHeaders, extractToken, getAppId, getClientVersion, getCookieString, getSession, updateCookie } from "./util";
import { IgRequest, IgResponse, ILoginResponse } from "@shared";

const login = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    console.log("----------try login----------")

    const account = req.data.account;

    let session = getSession(req.headers);

    const headers = baseRequestHeaders;
    headers["user-agent"] = session.userAgent

    const options :AxiosRequestConfig= {
        url: baseUrl,
        method: "GET",
        headers,
        withCredentials:true
    };

    try{

        headers.Cookie = "ig_cb=1;"
        headers["x-instagram-ajax"] = 1;
        const initialPage = await axios.request(options);

        const appId = getAppId(initialPage.data);
        const version = getClientVersion(initialPage.data);

        headers["x-ig-app-id"] = appId
        options.url = "https://i.instagram.com/api/v1/public/landing_info/"
        const baseResult = await axios.request(options);

        const baseCsrftoken = extractToken(baseResult.headers)

        if(!baseCsrftoken){
            throw new Error("Token not found")
        }

        const responseCookies = baseResult.headers["set-cookie"] instanceof Array ? baseResult.headers["set-cookie"] : [baseResult.headers["set-cookie"]]

        headers.Cookie = getCookieString(responseCookies);

        headers["x-requested-with"] = "XMLHttpRequest"
        headers["x-ig-www-claim"] = 0
        headers["x-instagram-ajax"] = version
        headers["x-csrftoken"] = baseCsrftoken;
        headers["x-requested-with"] = "XMLHttpRequest"
        headers["content-type"] = "application/x-www-form-urlencoded"

        const createEncPassword = (pwd:string) => {
            return `#PWD_INSTAGRAM_BROWSER:0:${Math.floor(Date.now() / 1000)}:${pwd}`
        }

        const params = new URLSearchParams();
        params.append("enc_password", createEncPassword(req.data.password))
        params.append("username", account)
        params.append("queryParams", "{}")
        params.append("optIntoOneTap", "false")
        params.append("trustedDeviceRecords", "{}")

        options.url = "https://i.instagram.com/api/v1/web/accounts/login/ajax/"
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
            try{
                return await requestChallenge(account, options, ex.response)
            }catch(ex:any){
                if(ex.response){
                    console.log(ex.response.data)
                }else{
                    console.log(ex.message)
                }
            }
        }

        if(ex.response){
            console.log(ex.response.data)
        }else{
            console.log(ex.message)
        }

        throw new Error("Login failed")
    }
}

const requestChallenge = async (account:string, options:AxiosRequestConfig, res:AxiosResponse<any, any>) :Promise<IgResponse<ILoginResponse>> => {

    console.log(options.headers)
    console.log(res.data);
    console.log(res.headers);
    console.log("---------- challenge start -------")

    if(!options.headers){
        throw new Error("headers empty");
    }

    const resToken = extractToken(res.headers);

    options.headers["x-csrftoken"] = resToken;

    const responseCookies = res.headers["set-cookie"] instanceof Array ? res.headers["set-cookie"] : [res.headers["set-cookie"]]

    options.headers.Cookie = getCookieString(responseCookies);

    console.log("---------- challenge get -------")
    console.log(options.headers)

    const url = "https://i.instagram.com" + res.data.checkpoint_url;
    options.url = url;
    options.method = "GET";
    options.data = "";

    const fres = await axios.request(options);

    console.log(fres.headers)

    console.log("---------- challenge post -------")

    options.headers["referer"] = url

    const params = new URLSearchParams();
    params.append("choice", "1")
    options.data = params;
    options.method = "POST"

    console.log(options.headers)

    const nextRes = await axios.request(options);

    console.log("---------- done -------")
    console.log(nextRes.data)
    console.log(nextRes.headers)

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
        //headers["x-requested-with"] = "XMLHttpRequest"
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

        const session = getSession(response.headers);
        const data = {account:req.data.account, success:session.isAuthenticated, challenge:!session.isAuthenticated, endpoint:""};

        console.log(response.data)

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

const logout = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>>  => {

    const currentSession = getSession(req.headers);

    if(!currentSession.isAuthenticated) throw new Error("Already logged out")

    try{

        const headers = createHeaders(baseUrl, currentSession);
        headers.Cookie = req.headers.cookie ?? "";

        const options :AxiosRequestConfig = {
            url: "https://i.instagram.com/api/v1/web/accounts/logout/ajax/",
            method: "POST",
            headers,
            withCredentials:true
        }

        const response = await axios.request(options);

        console.log(response.data)

        const session = getSession(response.headers);

        const data = {account:"", success:true, challenge:false, endpoint:""};

        return {
            data,
            session
        }

    }catch(ex:any){
        return {
            data:{account:"", success:true, challenge:false, endpoint:""},
            session: currentSession
        }
    }
}

export {login, challenge, logout}