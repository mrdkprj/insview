import { ILoginResponse } from "../response";

export const initialAuthState : ILoginResponse = {
    account:"",
    success:false,
    challenge:false,
    endpoint:""
}

export interface IAuthAction {
    type: string,
    value: any
}

export const AuthAction = {
    init: "init",
    update: "update",
    toggleAuth: "toggleAuth",
}

export const authStateReducer = (state: ILoginResponse, action: IAuthAction): ILoginResponse => {
    switch (action.type) {
        case AuthAction.init:
            const initState = initialAuthState
            initState.account = action.value;
            return {...state, ...initState};

        case AuthAction.update:
            return {...state, ...action.value}

        case AuthAction.toggleAuth:
            return {...state, success:action.value}

        default:
            return state;
    }
};

