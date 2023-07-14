export class AuthError extends Error {

    detail:ErrorDetail;

    constructor(detail:ErrorDetail) {
        super(detail.message)
        this.name = "AuthError"
        this.detail = detail
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

export class RequestError extends Error {

    requireLogin:boolean;

    constructor(message:string, requireLogin:boolean) {
        super(message)
        this.name = "RequestError"
        this.requireLogin = requireLogin;
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