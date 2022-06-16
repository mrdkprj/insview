import React, { useEffect, useCallback, useReducer } from "react";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import RefreshIcon from '@mui/icons-material/Refresh';
import InstagramIcon from '@mui/icons-material/Instagram';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircle from "@mui/icons-material/AccountCircle";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import UsernameDialog from "./component/UsernameDialog"
import ImageDialog from "./component/ImageDialog";
import LoginDialog from "./component/LoginDialog"
import AccountDialog from "./component/AccountDialog";
import {Grid, scrollTo} from "./component/Grid"
import {query, save, queryMore, login, challenge, logout, getFollowings, deleteHistory} from "./request";
import useWindowDimensions from "./dimensions";
import {appStateReducer, initialAppState, AppAction} from "./state/appStateReducer";
import {mediaStateReducer, initialMediaState, MediaAction} from "./state/mediaStateReducer";
import { IHistory, emptyResponse } from "./response";
import IconButton from "@mui/material/IconButton";

function App(){

    const barHeight = 45;

    const { width, height } = useWindowDimensions();

    const [appState, dispatchAppState] = useReducer(appStateReducer, initialAppState);

    const [mediaState, dispatchMediaState] = useReducer(mediaStateReducer, initialMediaState);

    const handleError = useCallback( async (ex:any, message:string = "") => {

        dispatchMediaState({type:MediaAction.toggleAuth, value: ex.data.igAuth})

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
        if(mediaState.rowIndex !== scrollTop){
            await save(mediaState.user.username, scrollTop);
        }
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
            dispatchMediaState({type:MediaAction.update, value: result})
            scrollTo(result.rowIndex)

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
            dispatchMediaState({type:MediaAction.append, value: result})

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

    const requestLogin = useCallback( async(username:string, password:string) => {

        dispatchAppState({type:AppAction.start})

        try{

            const result = await login(username, password);

            dispatchAppState({type:AppAction.toggleVerification, value:{value:result.challenge, url:result.endpoint}})

            if(!result.challenge){
                dispatchMediaState({type:MediaAction.toggleAuth, value: result.success})
                dispatchAppState({type:AppAction.toggleLoginModal, value:!result.success})
            }

        }catch(ex:any){

            handleError(ex, "Login attempt failed")

        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError]);

    const verifyCode = useCallback( async (code:string) => {

        try{

            const result = await challenge(code, appState.checkpointUrl);

            dispatchAppState({type:AppAction.toggleVerification, value:{value:result.challenge, url:result.endpoint}})

            if(!result.challenge){
                dispatchMediaState({type:MediaAction.toggleAuth, value: result.success})
                dispatchAppState({type:AppAction.toggleLoginModal, value:!result.success})
            }

        }catch(ex:any){

            handleError(ex, "Verification failed")

        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError, appState.checkpointUrl])

    const openAccountDialog = async () => {

        if(mediaState.followings.users.length <= 0){
            await requestFollowing();
        }

        if(mediaState.isAuthenticated){
            dispatchAppState({type:AppAction.toggleAccountModal, value:true})
        }

    }

    const closeAccountDialog = () => {
        dispatchAppState({type:AppAction.toggleAccountModal, value:false})
    }

    const requestFollowing = useCallback( async () => {

        try{

            dispatchMediaState({type:MediaAction.toggleLock, value: true})

            const result = await getFollowings(mediaState.followings.next);

            dispatchMediaState({type:MediaAction.followings, value: result})

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

    const onUserSelect = (username:string) => {
        closeAccountDialog();
        getInsImages(username, mediaState.history, false);
    }

    const requestLogout = useCallback( async () => {

        if(!window.confirm("Are you sure to logout?")){
            return;
        }

        dispatchAppState({type:AppAction.start})

        try{
            await logout();
            dispatchMediaState({type:MediaAction.toggleAuth, value: false})
            closeAccountDialog();
        }catch(ex:any){
            handleError(ex, "Logout attempt failed")
        }finally{
            dispatchAppState({type:AppAction.end})
        }

    },[handleError])

    const requestRefresh = useCallback( () => {

        if(!window.confirm("Refresh?")){
            return;
        }

        getInsImages(mediaState.user.username, mediaState.history, true);

    },[getInsImages, mediaState])

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
                <LoginDialog onClose={closeLoginDialog} onSubmit={requestLogin} onCodeSubmit={verifyCode} open={appState.openLoginModal} requireCode={appState.requireVerification}/>
            }

            {appState.openAccountModal &&
                <AccountDialog data={mediaState.followings} onUserSelect={onUserSelect} onClose={closeAccountDialog} height={height} width={width} onRequest={requestMoreFollowing} onLogout={requestLogout} open={appState.openAccountModal}/>
            }

            {appState.hasError &&
                <Snackbar sx={{zIndex:9000}} open={appState.hasError} autoHideDuration={3000} onClose={() => dispatchAppState({type:AppAction.hideError})} anchorOrigin={{ vertical:"top", horizontal:"center" }}>
                    <MuiAlert onClose={() => dispatchAppState({type:AppAction.hideError})} severity="error" sx={{ width: "100%" }} elevation={6} variant="filled">
                        {appState.errorMessage}
                    </MuiAlert>
                </Snackbar>
            }

            <AppBar position="fixed" style={{height: barHeight, display:"flex", justifyContent: "center", alignItems:"center"}} sx={{ bgcolor:"#fff"}}>
                {mediaState.isAuthenticated ?
                    <IconButton size="small" style={{position:"absolute", left:"5px"}} onClick={openAccountDialog}>
                        <InstagramIcon/>
                    </IconButton>
                    : <IconButton size="small" style={{position:"absolute", left:"5px"}} onClick={openLoginDialog}>
                        <LoginIcon/>
                    </IconButton>
                }
                <IconButton size="small" style={{position:"absolute", right:"5px"}} onClick={requestRefresh}>
                    <RefreshIcon/>
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