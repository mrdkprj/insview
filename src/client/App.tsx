import {Fragment, useEffect, useCallback, useReducer } from "react";
import AppBar from "@parts/AppBar"
import LinkButton from "@parts/LinkButton";
import Typography from "@parts/Typography"
import Backdrop from "@parts/Backdrop"
import Snackbar from "@parts/Snackbar";
import CircularProgress from "@parts/CircularProgress"
import UsernameDialog from "./component/UsernameDialog"
import AccountDialog from "./component/AccountDialog";
import LoginDialog from "./component/LoginDialog"
import RefreshIcon from "@mui/icons-material/Refresh";
import InstagramIcon from "@mui/icons-material/Instagram";
import LoginIcon from "@mui/icons-material/Login";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {Grid, scrollTo} from "./component/Grid"
import {query, save, queryMore, login, challenge, logout, getFollowings, deleteHistory, follow, unfollow} from "./request";
import useWindowDimensions from "./dimensions";
import {appStateReducer, initialAppState, AppAction} from "./state/appStateReducer";
import {mediaStateReducer, initialMediaState, MediaAction} from "./state/mediaStateReducer";
import {authStateReducer, initialAuthState, AuthAction} from "./state/authStateReducer";
import { IHistory, emptyResponse, IFollowingUser } from "@shared";

function App(){

    const barHeight = 45;

    const { width, height } = useWindowDimensions();

    const [appState, dispatchAppState] = useReducer(appStateReducer, initialAppState);
    const [mediaState, dispatchMediaState] = useReducer(mediaStateReducer, initialMediaState);
    const [authState, dispatchAuthState] = useReducer(authStateReducer, initialAuthState);

    const handleError = useCallback( async (ex:any, message = "") => {

        dispatchAuthState({type:AuthAction.toggleAuth, value: {success:ex.data.igAuth}})

        if(!ex.data.igAuth){
            return openLoginDialog();
        }

        if(message){
            dispatchAppState({type:AppAction.showError, value: message})
        }else{
            dispatchAppState({type:AppAction.showError, value: ex.message})
        }

    },[]);

    const onIdle = async (scrollTop :number) => {

        if(mediaState.mediaScrollTop === scrollTop) return;

        await save(mediaState.user.username, scrollTop);

        dispatchMediaState({type:MediaAction.mediaScrollTop, value: scrollTop})

    }

    /*
    * loadImages
    */
    const loadImages = useCallback(async (username:string, history:IHistory, refresh:boolean) => {

        dispatchAppState({type:AppAction.start})

        try{

            const result = await query(username, history, refresh);
            dispatchAuthState({type:AuthAction.toggleAuth, value:{success:result.status, account:result.data.account}})
            dispatchMediaState({type:MediaAction.update, value: result.data})
            scrollTo(result.data.rowIndex)

        }catch(ex:any){

            handleError(ex);

        }finally{

            dispatchAppState({type:AppAction.end})

        }

    },[handleError]);

    /*
    * loadMoreImages
    */
    const loadMoreImages = useCallback (async () => {

        if(mediaState.locked || !mediaState.next){
            return
        }

        try{

            dispatchMediaState({type:MediaAction.toggleLock, value: true})
            const result = await queryMore(mediaState.user, mediaState.next);
            dispatchAuthState({type:AuthAction.toggleAuth, value:{success:result.status}})
            dispatchMediaState({type:MediaAction.append, value: result.data})

        }catch(ex:any){

            handleError(ex);

        }finally{

            dispatchMediaState({type:MediaAction.toggleLock, value: false})

        }


    },[handleError, mediaState.locked, mediaState.next, mediaState.user])

    /*
    * Delete history
    */
    const requestDeleteHistory = useCallback( async(history:IHistory, target:string) => {

        dispatchAppState({type:AppAction.start})

        try{

            await deleteHistory(history, mediaState.user.username, target);

        }catch(ex:any){

            handleError(ex, "Update history failed")

        }finally{

            dispatchAppState({type:AppAction.end})

        }

    },[handleError, mediaState.user.username])

    /*
    * login
    */
    const requestLogin = useCallback( async(account:string, password:string) => {

        dispatchAppState({type:AppAction.start})

        try{

            dispatchAuthState({type:AuthAction.init, value:account});

            const result = await login(account, password);

            dispatchAuthState({type:AuthAction.update, value:result.status})

            if(!result.status.challenge){

                dispatchMediaState({type:MediaAction.update, value: result.media})
                dispatchAppState({type:AppAction.toggleLoginModal, value:!result.status.success})

            }

        }catch(ex:any){

            handleError(ex, "Login attempt failed")

        }finally{

            dispatchAppState({type:AppAction.end})

        }

    },[handleError]);

    /*
    * Code verification
    */
    const verifyCode = useCallback( async (code:string) => {

        dispatchAppState({type:AppAction.start})

        try{

            const result = await challenge(authState.account, code, authState.endpoint);

            dispatchAuthState({type:AuthAction.update, value:result.status})

            if(!result.status.challenge){
                dispatchMediaState({type:MediaAction.update, value: result.media})
                dispatchAppState({type:AppAction.toggleLoginModal, value:!result.status.success})
            }

        }catch(ex:any){

            handleError(ex, "Verification failed")

        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError, authState.account, authState.endpoint])

    /*
    * requestFollowing
    */
    const requestFollowing = useCallback( async () => {

        try{

            dispatchMediaState({type:MediaAction.toggleLock, value: true})

            const result = await getFollowings(mediaState.followings.next);

            dispatchAuthState({type:AuthAction.toggleAuth, value:{success:result.status}})
            dispatchMediaState({type:MediaAction.followings, value: result.data})

        }catch(ex:any){

            handleError(ex);

        }finally{

            dispatchMediaState({type:MediaAction.toggleLock, value: false})
        }

    },[handleError, mediaState.followings.next])

    /*
    * requestMoreFollowing
    */
    const requestMoreFollowing = useCallback( async () => {

        if(mediaState.locked || !mediaState.followings.hasNext){
            return;
        }

        await requestFollowing()

    },[mediaState.locked, mediaState.followings.hasNext, requestFollowing]);


    /*
    * AccountDialog
    */
    const openAccountDialog = async () => {

        if(mediaState.followings.users.length <= 0){
            await requestFollowing();
        }

        if(authState.success){
            dispatchAppState({type:AppAction.toggleAccountModal, value:true})
        }

    }

    const closeAccountDialog = useCallback((scrollTop:number) => {
        dispatchMediaState({type:MediaAction.followingScrollTop, value:scrollTop})
        dispatchAppState({type:AppAction.toggleAccountModal, value:false})
    },[])

    const onUserSelect = useCallback((username:string,) => {
        loadImages(username, mediaState.history, false);
    },[loadImages, mediaState.history]);

    /*
    * logout
    */
    const requestLogout = useCallback( async () => {

        if(!window.confirm("Are you sure to logout?")){
            return false;
        }

        dispatchAppState({type:AppAction.start})

        try{
            const result = await logout();
            dispatchAuthState({type:AuthAction.init, value:""})
            dispatchMediaState({type:MediaAction.update, value: result.media})
            return true;

        }catch(ex:any){
            handleError(ex, "Logout attempt failed")
            return false;
        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError])

    /*
    * Refresh
    */
    const requestRefresh = useCallback( () => {

        if(!window.confirm("Refresh?")){
            return;
        }

        loadImages(mediaState.user.username, mediaState.history, true);

    },[loadImages, mediaState.user.username, mediaState.history])

    /*
    * Follow/Unfollow
    */
    const toggleFollow = useCallback( async (doFollow:boolean, user:IFollowingUser) => {

        dispatchAppState({type:AppAction.start})

        try{

            if(doFollow){
                await follow(user);
            }else{
                await unfollow(user);
            }

            dispatchMediaState({type:MediaAction.updateFollowStatus, value: {doFollow, user}})

            return true;

        }catch(ex:any){
            handleError(ex, "Follow/Unfollow failed")
            return false;
        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError])

    /*
    * ImageDialog
    */
    const onImageClick = useCallback ((index : number) => {

        dispatchMediaState({type:MediaAction.select, value: index})
        dispatchAppState({type:AppAction.toggleImageModal, value:true})

    },[])

    /*
    * UsernameDialog
    */
    const onUsernameDialogClose = (history:IHistory) => {
        dispatchMediaState({type:MediaAction.history, value: history})
        dispatchAppState({type:AppAction.toggleUsernameModal, value:false})
    }

    const onUsernameSubmit = (name: string, history:IHistory) => {
        dispatchAppState({type:AppAction.toggleUsernameModal, value:false})
        loadImages(name, history, false);
    }

    const openUsernameDialog = () => {
        dispatchAppState({type:AppAction.toggleUsernameModal, value:true})
    }

    /*
    * LoginDialog
    */
    const openLoginDialog = () => {
        dispatchAppState({type:AppAction.toggleLoginModal, value:true})
    }

    const closeLoginDialog = () => {
        dispatchAppState({type:AppAction.toggleLoginModal, value:false})
    }

    /*
    * useEffect
    */
    useEffect(()=>{
        loadImages(emptyResponse.username, emptyResponse.history, false);
    },[loadImages])

    return (
        <Fragment>

            <Backdrop style={{ color: "#fff", zIndex: 9000 }} open={appState.isLoading}>
                <CircularProgress/>
            </Backdrop>

            {appState.openUsernameModal &&
                <UsernameDialog
                    open={appState.openUsernameModal}
                    username={mediaState.user.username}
                    onSubmit={onUsernameSubmit}
                    onClose={onUsernameDialogClose}
                    onUsernameDelete={requestDeleteHistory}
                    history={mediaState.history}/>
            }

            {appState.openLoginModal &&
                <LoginDialog open={appState.openLoginModal} onClose={closeLoginDialog} onSubmit={requestLogin} onCodeSubmit={verifyCode} requireCode={authState.challenge}/>
            }

            {appState.openAccountModal &&
                <AccountDialog
                    open={appState.openAccountModal}
                    account={authState.account}
                    data={mediaState.followings}
                    onUserSelect={onUserSelect}
                    onClose={closeAccountDialog}
                    height={height}
                    width={width}
                    onRequest={requestMoreFollowing}
                    onLogout={requestLogout}
                    toggleFollow={toggleFollow}
                    initialScrollTop={mediaState.followingScrollTop}
                />
            }

            {appState.hasError &&
                <Snackbar style={{zIndex:9000}} childStyle={{ width: "100%" }} open={appState.hasError} autoHideDuration={3000} onClose={() => dispatchAppState({type:AppAction.hideError})} >
                    {appState.errorMessage}
                </Snackbar>
            }

            <AppBar style={{position:"fixed", height: barHeight, display:"flex", justifyContent: "center", alignItems:"center", backgroundColor:"#fff" }}>
                {authState.success ?
                    <LinkButton size="small" style={{position:"absolute", left:"5px"}} onClick={openAccountDialog}>
                        <InstagramIcon/>
                    </LinkButton>
                    : <LinkButton size="small" style={{position:"absolute", left:"5px"}} onClick={openLoginDialog}>
                        <LoginIcon/>
                    </LinkButton>
                }
                <LinkButton size="small" style={{position:"absolute", right:"5px"}} onClick={requestRefresh}>
                    <RefreshIcon/>
                </LinkButton>
                <LinkButton style={{padding: 0}} type="button" onClick={openUsernameDialog}>
                    <div style={{flex:1,display:"flex", justifyContent:"center", alignItems:"center"}}>
                        <AccountCircleIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                        <Typography variant="subtitle1" style={{ flexGrow: 1, color:"#888" }}>{mediaState.user.username ? mediaState.user.username : "User not found"}</Typography>
                    </div>
                </LinkButton>
            </AppBar>

            <Grid data={mediaState.data} initialScrollTop={mediaState.mediaScrollTop} onImageClick={onImageClick} onIdle={onIdle} onLastItemRenrered={loadMoreImages} height={height} width={width} margin={barHeight}/>

        </Fragment>
  );
}

export default App;