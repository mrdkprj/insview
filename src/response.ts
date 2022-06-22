import { IncomingHttpHeaders } from "http";
import { Cookie } from "tough-cookie";

export class AuthError extends Error {
    constructor(message:string) {
        super(message)
        this.name = "REQUIRE_LOGIN"
        this.message = "You need to login"
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

export class RequestError extends Error {

    data:any;

    constructor(message:string, data:any) {
        super(message)
        this.name = "RequestError"
        this.data = data;
        Object.setPrototypeOf(this, RequestError.prototype);
    }
}

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

export const emptyMedia :IMedia = {
    id: "",
    media_url: ""
}

export const emptyUser :IUser = {
    id:"",
    igId:"",
    username:"",
    name:"",
    profileImage:"",
    biography:"",
}

export const emptyResponse :IMediaResponse = {
    username: "",
    media: [],
    user: emptyUser,
    rowIndex: 0,
    next: "",
    history:{},
    isAuthenticated:false
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

