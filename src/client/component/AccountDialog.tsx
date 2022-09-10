import { FixedSizeList } from "react-window";
import { styled } from "@mui/system";
import { memo, useCallback } from "react";
import { IFollowing, IUser} from "../../types";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import DialogContent from "@mui/material/DialogContent";
import Avatar from "@mui/material/Avatar";
import LogoutIcon from '@mui/icons-material/Logout';

export interface IAccountContext{
    open:boolean,
    height: number,
    width: number,
    data: IFollowing,
    onRequest: () => void,
    onLogout: () => void,
    onClose: () => void,
    onUserSelect: (username:string) => void,
    toggleFollow: (follow:boolean, user:IUser) => Promise<boolean>,
}

let rowCount = 0;

const barHeight = 45;

const AccountDialog = memo<IAccountContext>( (props) => {

    rowCount = props.data.users.length - 1;

    const Container = styled("div")({
        display:"flex",
        alignItems:"center",
        flex: 1,
    });

    const User = styled("div")({
        display:"flex",
        flexDirection: "column",
        flex: "1 1 auto"
    });

    const Names = styled("div")({
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "14px",
        width: "200px"
    });

    const Action = styled("button")({
        padding: "5px 9px",
        borderRadius: "4px",
        fontSize: "14px",
        backgroundColor: "rgb(255, 255, 255)",
        color: "rgb(0, 0, 0)",
        border: "1px solid #ccc",
        marginRight: "20px"
    })

    const toggleFollow = useCallback( async (e: React.MouseEvent<HTMLButtonElement>, user:IUser) => {

        const target :HTMLButtonElement = (e.target as HTMLButtonElement);

        const follow = target.classList.contains("following") ? false : true

        const result = await props.toggleFollow(follow, user);

        if(!result) return;

        if(target.classList.contains("following")){
            target.style["background-color" as any] = "rgb(25, 118, 210)"
            target.style["color"] = "rgb(255, 255, 255)"
            target.classList.remove("following");
            target.classList.add("unfollow");
            target.textContent = "Follow"
        }else{
            target.style["background-color" as any] = "rgb(255, 255, 255)"
            target.style["color"] = "rgb(0, 0, 0)"
            target.classList.remove("unfollow");
            target.classList.add("following");
            target.textContent = "Unfollow"
        }

    },[props])

    const onItemsRendered = ({visibleStopIndex}:{visibleStopIndex:number}) => {
        if(visibleStopIndex === rowCount - 1 && props.data.next){
            props.onRequest();
        }
    }

    const renderRow = ({ index, data, style } : { index:number, data:IUser[], style:any }) => {

        return (
            <Container style={style}>
                <Avatar alt={data[index].profileImage} src={data[index].profileImage} style={{marginRight:"15px", marginLeft:"24px"}}/>
                <User onClick={() => props.onUserSelect(data[index].username)}>
                    <Names>{data[index].name}</Names>
                    <Names>{data[index].username}</Names>
                </User>
                <Action onClick={(e) => toggleFollow(e, data[index])} className="following">Unfollow</Action>
            </Container>
        )
    }

    return(
        <Dialog
            sx={{zIndex:1300, overflowX:"hidden"}}
            open={props.open}
            fullScreen
            disableEnforceFocus={true}
            disableAutoFocus={true}
            hideBackdrop={true}
        >
            <AppBar style={{height: barHeight, display:"flex", justifyContent: "center", alignItems:"center"}} sx={{ bgcolor:"#fff"}}>
                <IconButton size="small" style={{position:"absolute", left:"5px"}} onClick={props.onClose}>
                        <CloseIcon />
                </IconButton>
                <Typography sx={{ color:"#888" }} variant="h6" component="div">Followings</Typography>
                <IconButton size="small" style={{position:"absolute", right:"5px"}} onClick={props.onLogout}>
                    <LogoutIcon />
                </IconButton>
            </AppBar>
            <DialogContent sx={{overflow:"hidden", padding:0, marginTop:barHeight + "px"}}>
                <FixedSizeList
                    style={{overflowX:"hidden"}}
                    height={props.height - barHeight}
                    itemCount={rowCount}
                    itemSize={60}
                    width={props.width}
                    itemData={props.data.users}
                    onItemsRendered={onItemsRendered}
                >
                    {renderRow}
                </FixedSizeList>
            </DialogContent>
        </Dialog>
    )
})

export default AccountDialog;