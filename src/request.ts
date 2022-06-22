import axios, {AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders} from "axios";
import {IMediaResponse, IHistory, IUser, IAuthResponse, IFollowing, RequestError, IResponse} from "./response"

const getState = (headers:AxiosResponseHeaders) :boolean => {

    return headers["ig-auth"] === "true" ? true : false;

}

const throwError = (ex:any) => {

    const authState = ex.response.headers["ig-auth"] === "true" ? true : false;

    throw new RequestError(ex.response.data, {igAuth: authState})

}

const query = async (username: string, history:IHistory, refresh:boolean) : Promise<IResponse<IMediaResponse>> => {

    const url = "/query";
    const method = "POST";
    const data = {username, history, refresh};

    const headers = {"Content-Type": "application/json"}

    const options :AxiosRequestConfig = {
        method,
        url,
        headers,
        data,
        withCredentials:true
    }

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

const queryMore = async (user:IUser, next:string) : Promise<IResponse<IMediaResponse>> => {

    const url = "/querymore";
    const method = "POST";
    const data = {user, next};

    const headers = {"Content-Type": "application/json"}

    const options :AxiosRequestConfig = {
        method,
        url,
        headers,
        data,
        withCredentials:true
    }

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

    const url = "/login";
    const method = "POST";
    const data = {account, password};

    const headers = {"Content-Type": "application/json"}

    const options :AxiosRequestConfig = {
        method,
        url,
        headers,
        data,
        withCredentials:true
    }

    try{
        const result :AxiosResponse<IAuthResponse> = await axios.request(options);

        return result.data;

    }catch(ex:any){

        return throwError(ex)

    }
}

const getFollowings = async (next:string) : Promise<IResponse<IFollowing>> => {

    const url = "/following";
    const method = "POST";
    const data = {next};

    const headers = {"Content-Type": "application/json"}

    const options :AxiosRequestConfig = {
        method,
        url,
        headers,
        data,
        withCredentials:true
    }

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

    const headers = {"Content-Type": "application/json"}

    const options :AxiosRequestConfig = {
        method,
        url,
        headers,
        data,
        withCredentials:true
    }

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

    const headers = {"Content-Type": "application/json"}

    const options :AxiosRequestConfig = {
        method,
        url,
        headers,
        data,
        withCredentials:true
    }

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

    const headers = {"Content-Type": "application/json"}

    const options :AxiosRequestConfig = {
        method,
        url,
        headers,
        data
    }

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

    const headers = {"Content-Type": "application/json"}

    const options :AxiosRequestConfig = {
        method,
        url,
        headers,
        data
    }

    try{
        await axios.request(options);

    }catch(ex:any){

        return throwError(ex)
    }
}

export { login, challenge, logout, query, queryMore, getFollowings, save, deleteHistory}