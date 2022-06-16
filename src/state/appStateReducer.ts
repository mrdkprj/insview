export interface IAppState {
    isLoading: boolean,
    openUsernameModal: boolean,
    openImageModal: boolean,
    openLoginModal: boolean,
    openAccountModal: boolean,
    hasError: boolean,
    errorMessage: string,
    requireVerification:boolean,
    checkpointUrl:string
};

export const initialAppState : IAppState = {
    isLoading: false,
    openUsernameModal: false,
    openImageModal: false,
    openLoginModal: false,
    openAccountModal: false,
    hasError: false,
    errorMessage: "",
    requireVerification: false,
    checkpointUrl:"",
}

export interface IAppAction {
    type: string,
    value?: any
}

export const AppAction = {
    start: "start",
    end: "end",
    toggleUsernameModal: "toggleUsernameModal",
    toggleImageModal: "toggleImageModal",
    toggleLoginModal: "toggleLoginModal",
    toggleAccountModal: "toggleAccountModal",
    toggleVerification: "toggleVerification",
    showError: "showError",
    hideError: "hideError"
}

export const appStateReducer = (state: IAppState, action: IAppAction): IAppState => {
    switch (action.type) {
        case AppAction.start:
            return {...state, isLoading:true};

        case AppAction.end:
            return {...state, isLoading:false};

        case AppAction.toggleUsernameModal:
            return {...state, openUsernameModal:action.value};

        case AppAction.toggleImageModal:
            return {...state, openImageModal:action.value};

        case AppAction.toggleLoginModal:
            return {...state, openLoginModal:action.value};

        case AppAction.toggleAccountModal:
            return {...state, openAccountModal:action.value};

        case AppAction.toggleVerification:
            return {...state, requireVerification:action.value.value, checkpointUrl: action.value.url};

        case AppAction.showError:
            return {...state, hasError:true, errorMessage: action.value};

        case AppAction.hideError:
            return {...state, hasError:false, errorMessage: ""};

        default:
            return state;
    }
};

