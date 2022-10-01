import { memo, useCallback } from "react";
import { FixedSizeList } from "react-window";
import { css } from "@emotion/react";
import { IFollowing, IFollowingUser} from "@shared";
import Dialog from "@parts/Dialog"
import AppBar from "@parts/AppBar"
import LinkButton from "@parts/LinkButton"
import Typography from "@parts/Typography"
import DialogContent from "@parts/DialogContent"
import Avatar from "@parts/Avatar"
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";

export interface IAccountContext{
    account:string,
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

    const Container = css({
        display:"flex",
        alignItems:"center",
        flex: 1,
    });

    const User = css({
        display:"flex",
        flexDirection: "column",
        flex: "1 1 auto"
    });

    const Names = css({
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "14px",
        width: "200px"
    });

    const UnfollowAction = css({
        padding: "5px 9px",
        borderRadius: "4px",
        fontSize: "14px",
        backgroundColor: "rgb(255, 255, 255)",
        color: "rgb(0, 0, 0)",
        border: "1px solid #ccc",
        marginRight: "20px"
    })

    const FollowAction = css({
        padding: "5px 9px",
        borderRadius: "4px",
        fontSize: "14px",
        backgroundColor: "rgb(25, 118, 210)",
        color: "rgb(255, 255, 255)",
        border: "1px solid #ccc",
        marginRight: "20px"
    })

    const toggleFollow = useCallback( async (e:any, user:IFollowingUser) => {

        await props.toggleFollow(!user.following, user);

    },[])

    const onItemsRendered = ({visibleStopIndex}:{visibleStopIndex:number}) => {
        if(visibleStopIndex === rowCount - 1 && props.data.next){
            props.onRequest();
        }
    }

    const renderRow = ({ index, data, style } : { index:number, data:IFollowingUser[], style:any }) => {

        return (
            <div css={Container} style={style}>
                <Avatar alt={data[index].profileImage} src={data[index].profileImage} style={{marginRight:"15px", marginLeft:"24px"}}/>
                <div css={User} onClick={() => props.onUserSelect(data[index].username)}>
                    <div css={Names}>{data[index].name}</div>
                    <div css={Names}>{data[index].username}</div>
                </div>
                {data[index].following ?
                    <button css={UnfollowAction} onClick={(e) => toggleFollow(e, data[index])}>Unfollow</button>
                    :
                    <button css={FollowAction} onClick={(e) => toggleFollow(e, data[index])}>Follow</button>
                }
            </div>
        )
    }

    return(
        <Dialog style={{zIndex:1300, overflowX:"hidden"}} open={props.open}>
            <AppBar style={{height: barHeight, display:"flex", justifyContent: "center", alignItems:"center", backgroundColor:"#fff"}}>
                <LinkButton size="small" style={{position:"absolute", left:"5px"}} onClick={props.onClose}>
                        <CloseIcon />
                </LinkButton>
                <Typography style={{ color:"#888" }} variant="h6">{props.account}</Typography>
                <LinkButton size="small" style={{position:"absolute", right:"5px"}} onClick={props.onLogout}>
                    <LogoutIcon />
                </LinkButton>
            </AppBar>
            <DialogContent style={{overflow:"hidden", padding:0}}>
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