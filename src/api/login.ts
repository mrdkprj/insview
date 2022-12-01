import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { baseRequestHeaders, baseUrl, createHeaders, extractToken, getAppId, getClientVersion, getCookieString, getSession } from "./util";
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

        //headers["x-requested-with"] = "XMLHttpRequest"
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

    console.log("---------- challenge start -------")
    console.log(res.data);

    if(!options.headers){
        throw new Error("headers empty");
    }

    const resToken = extractToken(res.headers);

    options.headers["x-csrftoken"] = resToken;

    const responseCookies = res.headers["set-cookie"] instanceof Array ? res.headers["set-cookie"] : [res.headers["set-cookie"]]

    options.headers.Cookie = getCookieString(responseCookies);

    const url = baseUrl + res.data.checkpoint_url;
    options.url = url;
    options.method = "GET"
    options.data = "";

    const nres = await axios.request(options)
    console.log(nres.headers["set-cookie"])

    console.log("---------- challenge post start -------")

    const params = new URLSearchParams();
    params.append("choice", "1")
    options.data = params;
    options.method = "POST"

    const nextRes1 = await axios.request(options);

    console.log("----------first challenge response-------")
    console.log(nextRes1.headers["set-cookie"])
    console.log(nextRes1.data)

    const nextRes1Token = extractToken(nextRes1.headers);
    options.headers["x-csrftoken"] = nextRes1Token;

    const c1 = nextRes1.headers["set-cookie"] instanceof Array ? nextRes1.headers["set-cookie"] : [nextRes1.headers["set-cookie"]]

    options.headers.Cookie = getCookieString(c1);

    const url2 = baseUrl;
    options.url = url2;
    options.method = "GET"
    options.data = "";

    const res2 = await axios.request(options)

    console.log("----------get response-------")
    console.log(res2.headers["set-cookie"])

    const params2 = new URLSearchParams();
    params2.append("choice", "0")
    options.url = "https://www.instagram.com/challenge/?next=https%3A%2F%2Fwww.instagram.com%2F%3F__coig_challenged%3D1"
    options.data = params2;
    options.method = "POST"

    const nextRes = await axios.request(options);

    const session = getSession(res.headers);

    console.log("----------challenge response-------")
    console.log(nextRes.data)
    console.log(nextRes.headers["set-cookie"])

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