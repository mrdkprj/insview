import { FixedSizeList } from "react-window";
import { styled } from "@mui/system";
import { memo } from "react";
import { IFollowing, IUser} from "../response";
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
        marginRight: "24px"
    });

    const Names = styled("div")({
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "14px",
        width: 300
    });

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