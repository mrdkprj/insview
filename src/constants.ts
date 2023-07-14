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