interface IAppState {
    isLoading: boolean;
    openUsernameModal: boolean;
    openImageModal: boolean;
    openLoginModal: boolean;
    openAccountModal: boolean;
    openPreviewModal:boolean;
    hasError: boolean;
    errorMessage: string;
}

interface IAppAction {
    type: string;
    value?: any;
}

export const initialAppState : IAppState = {
    isLoading: false,
    openUsernameModal: false,
    openImageModal: false,
    openLoginModal: false,
    openAccountModal: false,
    openPreviewModal: false,
    hasError: false,
    errorMessage: "",
}


export const AppAction = {
    start: "start",
    end: "end",
    toggleUsernameModal: "toggleUsernameModal",
    toggleImageModal: "toggleImageModal",
    toggleLoginModal: "toggleLoginModal",
    toggleAccountModal: "toggleAccountModal",
    togglePreviewModal: "togglePreviewModal",
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

        case AppAction.togglePreviewModal:
            return {...state, openPreviewModal:action.value}

        case AppAction.showError:
            return {...state, hasError:true, errorMessage: action.value};

        case AppAction.hideError:
            return {...state, hasError:false, errorMessage: ""};

        default:
            return state;
    }
};

