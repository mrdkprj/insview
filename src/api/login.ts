import axios, { AxiosRequestConfig, AxiosRequestHeaders } from "axios";
import { baseUrl, createHeaders, getAppId, getClientVersion, getSession, CookieStore, updateSession, logError, extractCsrfToken } from "./util";
import { AuthError, RequestError } from "../entity";

//const isProduction = process.env.NODE_ENV === "production";
const isProduction = true;

const login = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    if(isProduction) return await remoteLogin(req)

    return await localLogin(req);
}

const remoteLogin = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    console.log("---------- login start ----------")

    const account = req.data.account;

    let session = getSession({});
    session.userAgent = req.headers["user-agent"];
    const headers = createHeaders(baseUrl, session);
    let cookies = [];
    const jar = new CookieStore(process.env.API_URL);

    try{

        const options :AxiosRequestConfig= {};

        options.url = process.env.API_URL + "/login";
        options.method = "POST"
        options.headers = headers;
        options.data = {
            account,
            password:req.data.password
        }

        const response = await axios.request(options);
        console.log("----------auth response-------")
        console.log(response.data)

        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);

        if(response.data.authenticated == false){
            throw new AuthError({message:"Account or password wrong", data:response.data, requireLogin:true})
        }

        return {
            data:response.data,
            session
        }

    }catch(ex:any){

        const error = logError(ex)

        throw new AuthError(error)

    }
}

const localLogin = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    console.log("---------- login start ----------")

    const account = req.data.account;

    let session = getSession({});
    session.userAgent = req.headers["user-agent"];
    const headers = createHeaders(baseUrl, session);
    let cookies = [];
    const jar = new CookieStore();

    try{

        const options :AxiosRequestConfig= {};

        headers.Cookie = "ig_cb=1;"
        headers["x-instagram-ajax"] = 1;
        options.url = baseUrl;
        options.method = "GET"
        options.headers = headers;
        let response = await axios.request(options);

        const xHeaders :IgHeaders = {
            appId: getAppId(response.data),
            ajax: getClientVersion(response.data)
        }

        session.csrfToken = extractCsrfToken(response.data)

        cookies = await jar.storeCookie(response.headers["set-cookie"])

        headers["x-ig-app-id"] = xHeaders.appId
        headers.Cookie = await jar.getCookieStrings();
        session = updateSession(session, cookies, xHeaders)

/*
        options.url = "https://www.instagram.com/api/v1/public/landing_info/";
        options.method = "GET"
        options.headers = headers;

        response = await axios.request(options);

        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies, xHeaders)
        headers.Cookie = await jar.getCookieStrings()
*/

        headers["x-ig-www-claim"] = 0
        headers["x-instagram-ajax"] = xHeaders.ajax
        headers["x-csrftoken"] = session.csrfToken;
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

        options.url = "https://www.instagram.com/api/v1/web/accounts/login/ajax/"
        options.method = "POST"
        options.data = params;
        options.headers = headers;

        response = await axios.request(options);

        console.log("----------auth response-------")
        console.log(response.data)

        cookies = await jar.storeCookie(response.headers["set-cookie"]);
        session = updateSession(session, cookies);

        const data = {account, success:session.isAuthenticated, challenge:false, endpoint:""};

        return {
            data,
            session
        }

    }catch(ex:any){

        if(ex.response && ex.response.data.message && ex.response.data.message === "checkpoint_required"){
            console.log(ex.response.data)
            return await requestChallenge(account, ex.response.data.checkpoint_url, headers, session, jar)
        }

        const error = logError(ex)

        throw new AuthError(error)
    }
}

const requestChallenge = async (account:string, checkpoint:string, headers:AxiosRequestHeaders, session:ISession, jar:CookieStore) :Promise<IgResponse<ILoginResponse>> => {

    console.log("---------- challenge start -------")

    try{

        const options :AxiosRequestConfig= {};

        const url = "https://www.instagram.com" + checkpoint;
        console.log(url)
        options.url = url;
        options.method = "GET";
        options.headers = headers;

        let response = await axios.request(options);

        let cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies)

        headers["referer"] = url
        headers["x-csrftoken"] = session.csrfToken;

        const params = new URLSearchParams();
        params.append("choice", "1")

        options.data = params;
        options.method = "POST"
        options.headers = headers;

        response = await axios.request(options);

        console.log("---------- challenge response -------")
        console.log(response.data)
        console.log(response.headers)

        cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies)

        if(response.data.type && response.data.type === "CHALLENGE"){

            return {
                data:{account:account, success:false, challenge: true, endpoint:url},
                session
            }
        }

        throw new AuthError({message:"Challenge request failed",data:{account:account, success:false, challenge: true, endpoint:url}, requireLogin:true});

    }catch(ex:any){

        const error = logError(ex)

        throw new AuthError(error)

    }

}

const challenge = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {
    if(isProduction) return await remoteChallenge(req)

    return await localChallenge(req);
}

const remoteChallenge = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    console.log("-------------- code verification start ---------")

    const url = req.data.endpoint;

    const jar = new CookieStore(process.env.API_URL);
    const options :AxiosRequestConfig = {}
    let session = getSession(req.headers);
    const headers = createHeaders(url, session);

    await jar.storeRequestCookie(req.headers.cookie)
    headers.Cookie = await jar.getCookieStrings()

    //console.log(headers.Cookie)

    //const x = 10; if(x > 0) throw new Error("not now")

    try{

        options.url = process.env.API_URL + "/challenge";
        options.data = {
            endpoint:req.data.endpoint,
            account:req.data.account,
            code:req.data.code,
        };
        options.method = "POST"
        options.headers = headers;

        const response = await axios.request(options);

        const cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies);

        console.log(response.headers["set-cookie"])
        console.log(response.data)

        return {
            data:response.data,
            session
        }

    }catch(ex:any){

        const error = logError(ex);
        error.data = {account:req.data.account, success:false, challenge:true, endpoint:req.data.endpoint};

        throw new AuthError(error);

    }
}

const localChallenge = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>> => {

    console.log("-------------- code verification start ---------")

    const url = req.data.endpoint;

    const jar = new CookieStore();
    const options :AxiosRequestConfig = {}
    let session = getSession(req.headers);
    const headers = createHeaders(url, session);

    try{

        headers["x-ig-app-id"] = session.xHeaders.appId
        headers["x-ig-www-claim"] = 0
        headers["x-instagram-ajax"] = session.xHeaders.ajax
        headers["content-type"] = "application/x-www-form-urlencoded"

        await jar.storeRequestCookie(req.headers.cookie)
        headers.Cookie = await jar.getCookieStrings()

        const params = new URLSearchParams();
        params.append("security_code", req.data.code)

        options.url = url;
        options.data = params;
        options.method = "POST"
        options.headers = headers;

        const response = await axios.request(options);

        const cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies);
        const data = {account:req.data.account, success:session.isAuthenticated, challenge:!session.isAuthenticated, endpoint:""};

        console.log(response.data)

        return {
            data,
            session
        }

    }catch(ex:any){
        return {
            data:{account:req.data.account, success:false, challenge:true, endpoint:req.data.endpoint},
            session
        }
    }

}

const logout = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>>  => {
    if(isProduction) return await remoteLogout(req)

    return await localLogout(req);
}

const remoteLogout = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>>  => {
    return await localLogout(req);
}

const localLogout = async (req:IgRequest) : Promise<IgResponse<ILoginResponse>>  => {

    const jar = new CookieStore(process.env.API_URL);

    let session = getSession(req.headers);

    if(!session.isAuthenticated) throw new RequestError("Already logged out", false)

    try{

        const url = "https://www.instagram.com/api/v1/web/accounts/logout/ajax/";

        const headers = createHeaders(baseUrl, session);
        headers["x-ig-app-id"] = session.xHeaders.appId
        headers["x-ig-www-claim"] = 0
        headers["x-instagram-ajax"] = session.xHeaders.ajax
        headers["content-type"] = "application/x-www-form-urlencoded"

        await jar.storeRequestCookie(req.headers.cookie)
        headers.Cookie = await jar.getCookieStrings();

        const options :AxiosRequestConfig = {
            url,
            method: "POST",
            headers,
        }

        const response = await axios.request(options);

        console.log(response.data)
        const cookies = await jar.storeCookie(response.headers["set-cookie"])
        session = updateSession(session, cookies);

        const data = {account:"", success:true, challenge:false, endpoint:""};

        return {
            data,
            session
        }

    }catch(ex:any){
        return {
            data:{account:"", success:true, challenge:false, endpoint:""},
            session
        }
    }
}

export {login, challenge, logout}