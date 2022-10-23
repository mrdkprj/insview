
import {emptyUser, IFollowing, IHistory, IMedia, IUser} from "@shared";

interface IMediaState {
    locked: boolean;
    next:string;
    user: IUser;
    data: IMedia[];
    previewNext:string;
    previewUser:IUser;
    previewData:IMedia[];
    history: IHistory;
    isFollowingsReady:boolean;
    followings: IFollowing;
    mediaScrollTop: number;
    followingScrollTop:number;
}

interface IMediaAction {
    type: string;
    value?: any;
}

export const initialMediaState : IMediaState = {
    locked: false,
    next: "",
    user: emptyUser,
    data: [],
    previewNext:"",
    previewUser: emptyUser,
    previewData:[],
    history:{},
    isFollowingsReady:false,
    followings:{users:[], hasNext:false, next:""},
    mediaScrollTop: 0,
    followingScrollTop: 0,
}

export const MediaAction = {
    reset: "reset",
    update: "update",
    append: "append",
    history: "history",
    followings: "followings",
    updateFollowStatus: "updateFollowStatus",
    toggleLock: "toggleLock",
    mediaScrollTop : "mediaScrollTop",
    followingScrollTop: "followingScrollTop",
    preview: "preview",
    resetPreview: "resetPreview",
}

export const mediaStateReducer = (state: IMediaState, action: IMediaAction): IMediaState => {
    switch (action.type) {

        case MediaAction.reset: {
            const initalState = initialMediaState;
            initalState.user.username = action.value;
            return {...state, ...initalState};
        }
        case MediaAction.update:
            return {...state,
                user: action.value.user,
                data: action.value.media,
                next:action.value.next,
                history: action.value.history,
                mediaScrollTop:action.value.rowIndex
            };

        case MediaAction.append:
            return {...state, data:state.data.concat(action.value.media), next:action.value.next, mediaScrollTop: action.value.rowIndex}

        case MediaAction.history:
            return {...state, history:action.value};

        case MediaAction.mediaScrollTop:
            return {...state, mediaScrollTop: action.value}

        case MediaAction.followingScrollTop:
            return {...state, followingScrollTop: action.value}

        case MediaAction.toggleLock:
            return {...state, locked:action.value};

        case MediaAction.followings:{

            let users;
            if(state.followings.users.length > 0){
                users = state.followings.users.concat(action.value.users)
            }else{
                users = action.value.users
            }

            const newFollowings = {users, hasNext:action.value.hasNext, next:action.value.next};

            return {...state, isFollowingsReady:true, followings:newFollowings};
        }

        case MediaAction.updateFollowStatus:{

            if(state.previewUser.username === action.value.user.username){
                return {...state, isFollowingsReady:false, previewUser: {...state.previewUser, following:action.value.doFollow} }
            }

            const updatedUsers = state.followings.users.map(user => {
                if(user.username === action.value.user.username){
                    user.following = action.value.doFollow
                }

                return user;
            })

            return {...state, followings:{...state.followings, users:updatedUsers}};
        }

        case MediaAction.resetPreview:
            return {...state, previewData:[], previewNext:"", previewUser:emptyUser}

        case MediaAction.preview:{
            if(state.previewUser.username === action.value.user.username){
                return {...state, previewData: state.previewData.concat(action.value.media), previewNext: action.value.next};
            }else{
                return {...state, previewUser:action.value.user, previewData:action.value.media, previewNext: action.value.next};
            }

        }

        default:
            return state;
    }
};

