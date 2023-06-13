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

export const emptyMedia :IMedia = {
    id: "",
    media_url: "",
    taggedUsers:[],
    thumbnail_url:"",
    isVideo: false,
    permalink: "",
}

export const emptyUser :IUser = {
    id:"",
    igId:"",
    isPro:false,
    username:"",
    name:"",
    profileImage:"",
    biography:"",
    following:false,
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


export interface IResponse<T> {
    status: boolean;
    data: T;
}

export interface IMedia {
    id: string;
    media_url: string;
    taggedUsers: IUser[];
    thumbnail_url?:string;
    isVideo:boolean;
    permalink:string;
}

export interface IUser{
    id:string;
    igId:string;
    isPro:boolean;
    username:string;
    name:string;
    profileImage:string;
    biography:string;
    following:boolean;
}

export interface IHistory{
    [key: string]:IUser;
}

export interface IFollowing{
    users: IUser[];
    hasNext:boolean;
    next:string;
}

export interface IMediaResponse {
    username: string;
    media: IMedia[];
    user: IUser;
    rowIndex: number;
    next: string;
    history:IHistory;
    isAuthenticated:boolean;
    account?:string;
}

export interface ILoginResponse {
    account:string;
    success:boolean;
    challenge:boolean;
    endpoint:string;
}

export interface IgHeaders {
    appId:string;
    ajax:string;
}

export const IgHeaderNames = {
    appId:"x_app_id",
    ajax:"x_ajax"
}

export interface IAuthResponse {
    status:ILoginResponse;
    media:IMediaResponse;
}

export interface IgRequest{
    data:any;
    headers:IncomingHttpHeaders;
}

export interface IgResponse<T>{
    data:T;
    session: ISession;
}

export interface ISession {
    isAuthenticated:boolean;
    csrfToken:string;
    userId:string;
    cookies: Cookie[];
    expires: Date | null;
    xHeaders:IgHeaders;
    userAgent?:string;
}


