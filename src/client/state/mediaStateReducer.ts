
import {emptyUser, IFollowing, IHistory, IMedia, IUser} from "../../types";

export interface IMediaState {
    locked: boolean,
    next:string,
    user: IUser,
    data: IMedia[],
    selected: number,
    history: IHistory,
    followings: IFollowing,
    rowIndex: number,
};

export const initialMediaState : IMediaState = {
    locked: false,
    next: "",
    user: emptyUser,
    data: [],
    selected: 0,
    history:{},
    followings:{users:[], hasNext:false, next:""},
    rowIndex: 0,
}

export interface IMediaAction {
    type: string,
    value: any
}

export const MediaAction = {
    reset: "reset",
    update: "update",
    append: "append",
    select: "select",
    history: "history",
    followings: "followings",
    toggleLock: "toggleLock",
    updateRowIndex : "updateRowIndex",
}

export const mediaStateReducer = (state: IMediaState, action: IMediaAction): IMediaState => {
    switch (action.type) {

        case MediaAction.reset:
            const user = emptyUser;
            user.username = action.value;
            return {...state, user: user, data: [], selected: 0, next:"", rowIndex:0};

        case MediaAction.update:
            return {...state,
                user: action.value.user,
                data: action.value.media,
                selected: 0,
                next:action.value.next,
                history: action.value.history,
                rowIndex:action.value.rowIndex
            };

        case MediaAction.append:
            return {...state, data:state.data.concat(action.value.media), next:action.value.next, rowIndex: action.value.rowIndex}

        case MediaAction.select:
            return {...state, selected:action.value};

        case MediaAction.history:
            return {...state, history:action.value};

        case MediaAction.updateRowIndex:
            return {...state, rowIndex: action.value}

        case MediaAction.toggleLock:
            return {...state, locked:action.value};

        case MediaAction.followings:
            let users;
            if(state.followings.users.length > 0){
                users = state.followings.users.concat(action.value.users)
            }else{
                users = action.value.users
            }
            const newFollowings = {users, hasNext:action.value.hasNext, next:action.value.next};
            return {...state, followings:newFollowings};

        default:
            return state;
    }
};

