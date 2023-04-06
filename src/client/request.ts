import axios, {AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, AxiosResponseHeaders, Method} from "axios";
import {IMediaResponse, IHistory, IUser, IAuthResponse, IFollowing, RequestError, IResponse, IgHeaders, emptyResponse, ISession} from "@shared"

const createOptions = (url:string, method:Method, data:any) :AxiosRequestConfig => {

    const headers = {"Content-Type": "application/json"}

    return {
        method,
        url,
        headers,
        data,
        withCredentials:true
    }
}

const getState = (headers:AxiosResponseHeaders) :boolean => {

    return headers["ig-auth"] === "true";

}

const throwError = (ex:any) => {

    throw new RequestError(ex.response.data, {igAuth: ex.response.headers["ig-auth"] === "true"})

}

const query = async (username: string, history:IHistory, reload:boolean, preview:boolean) : Promise<IResponse<IMediaResponse>> => {

    const url = "/query";
    const method = "POST";
    const data = {username, history, reload, preview};

    const options = createOptions(url, method, data);

    try{
        const result :AxiosResponse<IMediaResponse> = await axios.request(options);

        return {
            status: getState(result.headers),
            data: result.data,
        }

    }catch(ex:any){
        return throwError(ex)
    }

}

const queryMore = async (user:IUser, next:string, preview:boolean) : Promise<IResponse<IMediaResponse>> => {

    const url = "/querymore";
    const method = "POST";
    const data = {user, next, preview};

    const options = createOptions(url, method, data);

    try{
        const result :AxiosResponse<IMediaResponse> = await axios.request(options);

        return {
            status: getState(result.headers),
            data: result.data,
        }

    }catch(ex:any){
        return throwError(ex)
    }

}

const login = async (account:string, password:string) : Promise<IAuthResponse> => {
/*
    const url = "/login";
    const method = "POST";
    const data = {account, password};

    const options = createOptions(url, method, data);

    try{
        const result :AxiosResponse<IAuthResponse> = await axios.request(options);

        return result.data;

    }catch(ex:any){
        return throwError(ex)
    }
    */

    console.log("---------- login start ----------")

    const session :ISession = {
        isAuthenticated:false,
        csrfToken:"",
        userId:"",
        userAgent: navigator.userAgent,
        cookies:[],
        expires: null,
        xHeaders:{appId:"", ajax:""}
    }


    const baseUrl = "https://www.instagram.com"


    const baseRequestHeaders :AxiosRequestHeaders = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "en-US",
        "Authority": "www.instagram.com",
    }
        const headers = baseRequestHeaders;
        headers["origin"] = "https://www.instagram.com"
        headers["referer"] = baseUrl
        headers["x-requested-with"] = "XMLHttpRequest"
        headers["x-csrftoken"] = session.csrfToken;
        headers["user-agent"] = session.userAgent;

        const getAppId = (data:any) => {
            const appIds = data.match(/"customHeaders":{"X-IG-App-ID":"(.*)","X-IG-D"/)
            return appIds[1]
        }

        const getClientVersion = (data:any) => {
            const version = data.match(/"client_revision":(.*),"tier"/)
            return version[1]
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

    let cookies:string[] = [];

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

        if(response.headers["set-cookie"]){
            cookies =response.headers["set-cookie"].map(str => {
                return str.substring(1, str.indexOf(";"))
            })
        }

        headers["x-ig-app-id"] = xHeaders.appId
        headers.Cookie = cookies.join(";")

        options.url = "https://www.instagram.com/api/v1/public/landing_info/";
        options.method = "GET"
        options.headers = headers;
        options.withCredentials = true;

        response = await axios.request(options);

        if(response.headers["set-cookie"]){
            cookies = response.headers["set-cookie"].map(str => {
                return str.substring(1, str.indexOf(";"))
            }).filter(x => !cookies.includes(x))
        }

        headers.Cookie = cookies.join(";")

        headers["x-ig-www-claim"] = 0
        headers["x-instagram-ajax"] = xHeaders.ajax
        headers["x-csrftoken"] = session.csrfToken;
        headers["content-type"] = "application/x-www-form-urlencoded"

        const createEncPassword = (pwd:string) => {
            return `#PWD_INSTAGRAM_BROWSER:0:${Math.floor(Date.now() / 1000)}:${pwd}`
        }

        const params = new URLSearchParams();
        params.append("enc_password", createEncPassword(password))
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

        const data = {account, success:session.isAuthenticated, challenge:false, endpoint:""};

        return {
            status:data,
            media:emptyResponse

        }

    }catch(ex:any){

        if(ex.response && ex.response.data.message && ex.response.data.message === "checkpoint_required"){
            console.log(ex.response.data)
        }

        logError(ex)

        return throwError(ex)
    }
}

const getFollowings = async (next:string) : Promise<IResponse<IFollowing>> => {

    const url = "/following";
    const method = "POST";
    const data = {next};

    const options = createOptions(url, method, data);

    try{
        const result :AxiosResponse<IFollowing> = await axios.request(options);

        return {
            status: getState(result.headers),
            data: result.data,
        }

    }catch(ex:any){
        return throwError(ex)
    }
}

const challenge = async (account:string, code:string, endpoint:string) : Promise<IAuthResponse> => {

    const url = "/challenge";
    const method = "POST";
    const data = {account, code, endpoint};

    const options = createOptions(url, method, data);

    try{
        const result :AxiosResponse<IAuthResponse> = await axios.request(options);

        return result.data;

    }catch(ex:any){
        return throwError(ex)
    }
}

const logout = async () : Promise<IAuthResponse> => {

    const url = "/logout";
    const method = "POST";
    const data = {};

    const options = createOptions(url, method, data);

    try{
        const result :AxiosResponse<IAuthResponse> = await axios.request(options);

        return result.data;

    }catch(ex:any){
        return throwError(ex)
    }
}

const save = async (username:string, rowIndex:number) => {

    const url = "/save";
    const method = "POST";
    const data = {username, rowIndex};

    const options = createOptions(url, method, data);

    try{
        await axios.request(options);
    }catch(ex:any){
        return throwError(ex)
    }

}

const deleteHistory = async (history:IHistory, current:string, target:string) => {

    const url = "/remove";
    const method = "POST";
    const data = {history, current, target};

    const options = createOptions(url, method, data);

    try{
        await axios.request(options);
    }catch(ex:any){
        return throwError(ex)
    }

}

const follow = async (user:IUser) => {

    const url = "/follow";
    const method = "POST";
    const data = {user};

    const options = createOptions(url, method, data);

    try{
        return await axios.request(options);
    }catch(ex:any){
        return throwError(ex)
    }

}

const unfollow = async (user:IUser) => {

    const url = "/unfollow";
    const method = "POST";
    const data = {user};

    const options = createOptions(url, method, data);

    try{
        return await axios.request(options);
    }catch(ex:any){
        return throwError(ex)
    }

}

export { login, challenge, logout, query, queryMore, getFollowings, save, deleteHistory, follow, unfollow}