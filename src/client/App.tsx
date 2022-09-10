import React, { useEffect, useCallback, useReducer } from "react";
import {Box, AppBar, Typography, Link, Backdrop, CircularProgress, Snackbar, Alert} from "@mui/material";
import {Refresh, Instagram, Login, AccountCircle} from "@mui/icons-material"
import UsernameDialog from "./component/UsernameDialog"
import ImageDialog from "./component/ImageDialog";
import LoginDialog from "./component/LoginDialog"
import AccountDialog from "./component/AccountDialog";
import IconButton from "@mui/material/IconButton";
import {Grid, scrollTo} from "./component/Grid"
import {query, save, queryMore, login, challenge, logout, getFollowings, deleteHistory, follow, unfollow} from "./request";
import useWindowDimensions from "./dimensions";
import {appStateReducer, initialAppState, AppAction} from "./state/appStateReducer";
import {mediaStateReducer, initialMediaState, MediaAction} from "./state/mediaStateReducer";
import {authStateReducer, initialAuthState, AuthAction} from "./state/authStateReducer";
import { IHistory, emptyResponse, IUser } from "../types";

function App(){

    const barHeight = 45;

    const { width, height } = useWindowDimensions();

    const [appState, dispatchAppState] = useReducer(appStateReducer, initialAppState);
    const [mediaState, dispatchMediaState] = useReducer(mediaStateReducer, initialMediaState);
    const [authState, dispatchAuthState] = useReducer(authStateReducer, initialAuthState);

    const handleError = useCallback( async (ex:any, message:string = "") => {

        dispatchAuthState({type:AuthAction.toggleAuth, value: ex.data.igAuth})

        if(!ex.data.igAuth){
            return openLoginDialog();
        }

        if(message){
            dispatchAppState({type:AppAction.showError, value: message})
        }else{
            dispatchAppState({type:AppAction.showError, value: ex.message})
        }

    },[]);

    const onImageClick = useCallback ((index : number) => {

        dispatchMediaState({type:MediaAction.select, value: index})
        dispatchAppState({type:AppAction.toggleImageModal, value:true})

    },[])

    const onIdle = useCallback( async (scrollTop :number) => {
        if(mediaState.rowIndex === scrollTop) return;

        await save(mediaState.user.username, scrollTop);

        dispatchMediaState({type:MediaAction.updateRowIndex, value: scrollTop})

    },[mediaState]);

    const onUsernameDialogClose = (history:IHistory) => {
        dispatchMediaState({type:MediaAction.history, value: history})
        dispatchAppState({type:AppAction.toggleUsernameModal, value:false})
    }

    const onUsernameSubmit = (name: string, history:IHistory) => {
        dispatchAppState({type:AppAction.toggleUsernameModal, value:false})
        getInsImages(name, history, false);
    }

    const openUsernameDialog = () => {
        dispatchAppState({type:AppAction.toggleUsernameModal, value:true})
    }

    const onImageClose = () => {
        dispatchAppState({type:AppAction.toggleImageModal, value:false})
    }

    const getInsImages = useCallback(async (username:string, history:IHistory, refresh:boolean) => {

        dispatchAppState({type:AppAction.start})

        try{

            const result = await query(username, history, refresh);
            dispatchAuthState({type:AuthAction.toggleAuth, value:result.status})
            dispatchMediaState({type:MediaAction.update, value: result.data})
            scrollTo(result.data.rowIndex)

        }catch(ex:any){

            handleError(ex);

        }finally{

            dispatchAppState({type:AppAction.end})

        }

    },[handleError]);

    const loadMoreImages = useCallback (async () => {

        if(mediaState.locked || !mediaState.next){
            return
        }

        try{

            dispatchMediaState({type:MediaAction.toggleLock, value: true})
            const result = await queryMore(mediaState.user, mediaState.next);
            dispatchAuthState({type:AuthAction.toggleAuth, value:result.status})
            dispatchMediaState({type:MediaAction.append, value: result.data})

        }catch(ex:any){

            handleError(ex);

        }finally{

            dispatchMediaState({type:MediaAction.toggleLock, value: false})

        }


    },[mediaState.locked, mediaState.next, mediaState.user, handleError])

    const openLoginDialog = () => {
        dispatchAppState({type:AppAction.toggleLoginModal, value:true})
    }

    const closeLoginDialog = () => {
        dispatchAppState({type:AppAction.toggleLoginModal, value:false})
    }

    const requestDeleteHistory = useCallback( async(history:IHistory, target:string) => {

        dispatchAppState({type:AppAction.start})

        try{
            await deleteHistory(history, mediaState.user.username, target);
        }catch(ex:any){
            handleError(ex, "Update history failed")
        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[mediaState.user.username, handleError])

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

    const verifyCode = useCallback( async (code:string) => {

        try{

            const result = await challenge(authState.account, code, authState.endpoint);

            dispatchAuthState({type:AuthAction.update, value:result.status})

            if(!result.status.challenge){
                dispatchAppState({type:AppAction.toggleLoginModal, value:!result.status.success})
            }

        }catch(ex:any){

            handleError(ex, "Verification failed")

        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError, authState.account, authState.endpoint])

    const openAccountDialog = async () => {

        if(mediaState.followings.users.length <= 0){
            await requestFollowing();
        }

        if(authState.success){
            dispatchAppState({type:AppAction.toggleAccountModal, value:true})
        }

    }

    const closeAccountDialog = useCallback(() => {
        dispatchAppState({type:AppAction.toggleAccountModal, value:false})
    },[])

    const requestFollowing = useCallback( async () => {

        try{

            dispatchMediaState({type:MediaAction.toggleLock, value: true})

            const result = await getFollowings(mediaState.followings.next);

            dispatchAuthState({type:AuthAction.toggleAuth, value:result.status})
            dispatchMediaState({type:MediaAction.followings, value: result.data})

        }catch(ex:any){

            handleError(ex);

        }finally{

            dispatchMediaState({type:MediaAction.toggleLock, value: false})
        }

    },[mediaState.followings.next, handleError])

    const requestMoreFollowing = useCallback( async () => {

        if(mediaState.locked || !mediaState.followings.hasNext){
            return;
        }

        await requestFollowing()

    },[mediaState.locked, mediaState.followings.hasNext, requestFollowing]);

    const onUserSelect = useCallback((username:string) => {
        closeAccountDialog();
        getInsImages(username, mediaState.history, false);
    },[closeAccountDialog, getInsImages, mediaState.history]);

    const requestLogout = useCallback( async () => {

        if(!window.confirm("Are you sure to logout?")){
            return;
        }

        dispatchAppState({type:AppAction.start})

        try{
            await logout();
            dispatchAuthState({type:AuthAction.init, value:""})
            closeAccountDialog();
        }catch(ex:any){
            handleError(ex, "Logout attempt failed")
        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError, closeAccountDialog])

    const requestRefresh = useCallback( () => {

        if(!window.confirm("Refresh?")){
            return;
        }

        getInsImages(mediaState.user.username, mediaState.history, true);

    },[getInsImages, mediaState])

    const toggleFollow = useCallback( async (doFollow:boolean, user:IUser) => {

        dispatchAppState({type:AppAction.start})

        try{

            if(doFollow){
                await follow(user);
            }else{
                await unfollow(user);
            }

            return true;

        }catch(ex:any){
            handleError(ex, "Follow/Unfollow failed")
            return false;
        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError])

    useEffect(()=>{

        getInsImages(emptyResponse.username, emptyResponse.history, false);

    },[getInsImages])

    return (
        <React.Fragment>

            {appState.isLoading &&
                <Backdrop sx={{ color: "#fff", zIndex: 9000 }} open={appState.isLoading}>
                    <CircularProgress color="inherit" />
                </Backdrop>
            }

            {appState.openUsernameModal &&
                <UsernameDialog username={mediaState.user.username} onSubmit={onUsernameSubmit} onClose={onUsernameDialogClose} onUsernameDelete={requestDeleteHistory} history={mediaState.history} open={appState.openUsernameModal}/>
            }

            {appState.openImageModal &&
                <ImageDialog onClose={onImageClose} mediaId={mediaState.data[mediaState.selected].id} mediaUrl={mediaState.data[mediaState.selected].media_url}/>
            }

            {appState.openLoginModal &&
                <LoginDialog onClose={closeLoginDialog} onSubmit={requestLogin} onCodeSubmit={verifyCode} open={appState.openLoginModal} requireCode={authState.challenge}/>
            }

            {appState.openAccountModal &&
                <AccountDialog
                    data={mediaState.followings}
                    onUserSelect={onUserSelect}
                    onClose={closeAccountDialog}
                    height={height}
                    width={width}
                    onRequest={requestMoreFollowing}
                    onLogout={requestLogout}
                    toggleFollow={toggleFollow}
                    open={appState.openAccountModal}
                />
            }

            {appState.hasError &&
                <Snackbar sx={{zIndex:9000}} open={appState.hasError} autoHideDuration={3000} onClose={() => dispatchAppState({type:AppAction.hideError})} anchorOrigin={{ vertical:"top", horizontal:"center" }}>
                    <Alert onClose={() => dispatchAppState({type:AppAction.hideError})} severity="error" sx={{ width: "100%" }} elevation={6} variant="filled">
                        {appState.errorMessage}
                    </Alert>
                </Snackbar>
            }

            <AppBar position="fixed" style={{height: barHeight, display:"flex", justifyContent: "center", alignItems:"center"}} sx={{ bgcolor:"#fff"}}>
                {authState.success ?
                    <IconButton size="small" style={{position:"absolute", left:"5px"}} onClick={openAccountDialog}>
                        <Instagram/>
                    </IconButton>
                    : <IconButton size="small" style={{position:"absolute", left:"5px"}} onClick={openLoginDialog}>
                        <Login/>
                    </IconButton>
                }
                <IconButton size="small" style={{position:"absolute", right:"5px"}} onClick={requestRefresh}>
                    <Refresh/>
                </IconButton>
                <Link component="button" underline="none" onClick={openUsernameDialog}>
                    <Box style={{flex:1,display:"flex", justifyContent:"center", alignItems:"center"}}>
                        <AccountCircle sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                        <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1, color:"#888" }}>{mediaState.user.username ? mediaState.user.username : "User not found"}</Typography>
                    </Box>
                </Link>
            </AppBar>

            <Grid data={mediaState.data} onImageClick={onImageClick} onIdle={onIdle} onLastItemRenrered={loadMoreImages} height={height - barHeight} width={width} />

        </React.Fragment>
  );
}

export default App;