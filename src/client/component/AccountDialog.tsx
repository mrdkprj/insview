import { FixedSizeList } from "react-window";
import { styled } from "@mui/system";
import { memo, useCallback } from "react";
import { IFollowing, IFollowingUser} from "../../types";
import { Dialog, AppBar, IconButton, Typography, DialogContent, Avatar} from "@mui/material";
import { Close, Logout} from "@mui/icons-material";

export interface IAccountContext{
    open:boolean,
    height: number,
    width: number,
    data: IFollowing,
    onRequest: () => void,
    onLogout: () => void,
    onClose: () => void,
    onUserSelect: (username:string) => void,
    toggleFollow: (follow:boolean, user:IFollowingUser) => Promise<boolean>,
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

    const UnfollowAction = styled("button")({
        padding: "5px 9px",
        borderRadius: "4px",
        fontSize: "14px",
        backgroundColor: "rgb(255, 255, 255)",
        color: "rgb(0, 0, 0)",
        border: "1px solid #ccc",
        marginRight: "20px"
    })

    const FollowAction = styled("button")({
        padding: "5px 9px",
        borderRadius: "4px",
        fontSize: "14px",
        backgroundColor: "rgb(25, 118, 210)",
        color: "rgb(255, 255, 255)",
        border: "1px solid #ccc",
        marginRight: "20px"
    })

    const toggleFollow = useCallback( async (e: React.MouseEvent<HTMLButtonElement>, user:IFollowingUser) => {

        await props.toggleFollow(!user.following, user);

    },[])

    const onItemsRendered = ({visibleStopIndex}:{visibleStopIndex:number}) => {
        if(visibleStopIndex === rowCount - 1 && props.data.next){
            props.onRequest();
        }
    }

    const renderRow = ({ index, data, style } : { index:number, data:IFollowingUser[], style:any }) => {

        return (
            <Container style={style}>
                <Avatar alt={data[index].profileImage} src={data[index].profileImage} style={{marginRight:"15px", marginLeft:"24px"}}/>
                <User onClick={() => props.onUserSelect(data[index].username)}>
                    <Names>{data[index].name}</Names>
                    <Names>{data[index].username}</Names>
                </User>
                {data[index].following ?
                    <UnfollowAction onClick={(e) => toggleFollow(e, data[index])}>Unfollow</UnfollowAction>
                    :
                    <FollowAction onClick={(e) => toggleFollow(e, data[index])}>Follow</FollowAction>
                }
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
                        <Close />
                </IconButton>
                <Typography sx={{ color:"#888" }} variant="h6" component="div">Followings</Typography>
                <IconButton size="small" style={{position:"absolute", right:"5px"}} onClick={props.onLogout}>
                    <Logout />
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