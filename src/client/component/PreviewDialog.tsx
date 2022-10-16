import AppBar from "@parts/AppBar"
import LinkButton from "@parts/LinkButton";
import Typography from "@parts/Typography"
import Dialog from "@parts/Dialog"
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite"
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"
import Grid from "./Grid"
import { IMedia, IUser } from "@shared";

type PreviewDialogProps = {
    user:IUser,
    data: IMedia[],
    height:number,
    width:number,
    margin:number,
    open: boolean,
    onClose: () => void,
    toggleFollow: (doFollow:boolean, user:IUser) => Promise<boolean>,
    onLastItemRenrered: () => void,
}

const PreviewDialog = (props:PreviewDialogProps) => {

    const toggleFollow = () => {
        const doFollow = !props.user.following
        props.toggleFollow(doFollow, props.user);
    }

    return (
        <Dialog style={{zIndex:1300}} open={props.open}>
            <AppBar style={{position:"fixed", height: props.margin, display:"flex", justifyContent: "center", alignItems:"center", backgroundColor:"rgb(33 86 139)" }}>
                <LinkButton style={{color:"inherit", position: "absolute", left:"5px"}} onClick={props.onClose}>
                    <CloseIcon />
                </LinkButton>
                <Typography variant="subtitle1">{props.user.username}</Typography>
                <LinkButton style={{color:"inherit", position: "absolute", right:"5px"}} onClick={toggleFollow}>
                    {props.user.following === true ?
                        <FavoriteBorderIcon />
                        :
                        <FavoriteIcon/>
                    }
                </LinkButton>
            </AppBar>

            <Grid
                data={props.data}
                height={props.height}
                width={props.width}
                margin={props.margin}
                onLastItemRenrered={props.onLastItemRenrered}
            />
        </Dialog>
    )
}

export default PreviewDialog