import { memo, useCallback, useRef } from "react";
import { FixedSizeList } from "react-window";
import { css } from "@emotion/react";
import Dialog from "@parts/Dialog"
import AppBar from "@parts/AppBar"
import LinkButton from "@parts/LinkButton"
import Typography from "@parts/Typography"
import DialogContent from "@parts/DialogContent"
import Avatar from "@parts/Avatar"
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";

interface AccountDialogProps {
    account:string;
    open:boolean;
    height: number;
    width: number;
    data: IFollowing;
    initialScrollTop?:number;
    onRequest: () => void;
    onLogout: () => Promise<boolean>;
    onClose: (scrollTop:number) => void;
    onUserSelect: (username:string) => void;
    toggleFollow: (follow:boolean, user:IUser) => Promise<boolean>;
}

const barHeight = 45;

const AccountDialog = memo<AccountDialogProps>( (props) => {

    const rowCount = props.data.users.length - 1;
    const listScrollTop = useRef<number>(0);

    const toggleFollow = useCallback( async (e:any, user:IUser) => {

        await props.toggleFollow(!user.following, user);

    },[props])

    const onItemsRendered = ({visibleStopIndex}:{visibleStopIndex:number}) => {
        if(visibleStopIndex === rowCount - 1 && props.data.next){
            props.onRequest();
        }
    }

    const closeDialog = () => {
        props.onClose(listScrollTop.current)
    }

    const requestLogout = async () => {
        const result = await props.onLogout();
        if(result) closeDialog();
    }

    const selectUser = (username:string) => {
        closeDialog();
        props.onUserSelect(username);
    }

    const onListScroll = ({scrollOffset}:{scrollOffset:number}) => {
        listScrollTop.current = scrollOffset;
    }

    const renderRow = ({ index, data, style } : { index:number, data:IUser[], style:any }) => {

        return (
            <div css={Container} style={style}>
                <Avatar alt={data[index].profileImage} src={data[index].profileImage} style={{marginRight:"15px", marginLeft:"24px"}}/>
                <div css={User} onClick={() => selectUser(data[index].username)}>
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
                <LinkButton size="small" style={{position:"absolute", left:"5px"}} onClick={closeDialog}>
                        <CloseIcon />
                </LinkButton>
                <Typography style={{ color:"#888" }} variant="h6">{props.account}</Typography>
                <LinkButton size="small" style={{position:"absolute", right:"5px"}} onClick={requestLogout}>
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
                    onScroll={onListScroll}
                    initialScrollOffset={props.initialScrollTop}
                    onItemsRendered={onItemsRendered}
                >
                    {renderRow}
                </FixedSizeList>
            </DialogContent>
        </Dialog>
    )
})

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

export default AccountDialog;