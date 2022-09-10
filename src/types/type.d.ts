import { IncomingHttpHeaders } from "http";
import { Cookie } from "tough-cookie";

export interface IResponse<T> {
    status: boolean,
    data: T,
}

export interface IMedia {
    id: string,
    media_url: string;
}

export interface IUser{
    id:string,
    igId:string,
    username:string,
    name:string,
    profileImage:string,
    biography:string,
}

export interface IHistory{
    [key: string]:IUser
}

export interface IFollowing{
    users: IUser[],
    hasNext:boolean,
    next:string
}

export interface IMediaResponse {
    username: string;
    media: IMedia[];
    user: IUser,
    rowIndex: number;
    next: string,
    history:IHistory,
    isAuthenticated:boolean,
}

export interface ILoginResponse {
    account:string,
    success:boolean,
    challenge:boolean,
    endpoint:string,
}

export interface IAuthResponse {
    status:ILoginResponse,
    media:IMediaResponse
}

export interface IgRequest{
    data:any,
    headers:IncomingHttpHeaders,
}

export interface IgResponse<T>{
    data:T,
    session: ISession
}

export interface ISession {
    isAuthenticated:boolean,
    csrfToken:string,
    userId:string,
    userAgent:string,
    cookies: Cookie[],
    expires: Date | null,
}

