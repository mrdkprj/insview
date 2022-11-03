interface IAppState {
    isLoading: boolean;
    openSearchModal: boolean;
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
    openSearchModal: false,
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
    toggleSearchModal: "toggleSearchModal",
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

        case AppAction.toggleSearchModal:
            return {...state, openSearchModal:action.value};

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

