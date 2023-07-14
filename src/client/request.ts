import axios, {AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders, Method} from "axios";

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

    throw new RequestError(ex.response.data.message, ex.response.headers["ig-auth"] === "true")

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