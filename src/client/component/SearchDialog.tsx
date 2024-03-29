import {RefObject, ChangeEvent, MouseEvent, useState, createRef, useEffect} from "react";
import Dialog from "@parts/Dialog"
import AppBar from "@parts/AppBar"
import LinkButton from "@parts/LinkButton"
import Typography from "@parts/Typography"
import List from "@parts/List"
import ListItem from "@parts/ListItem"
import Avatar from "@parts/Avatar"
import DialogContent from "@parts/DialogContent";
import Button from "@parts/Button"
import TextField from "@parts/TextField"
import CloseIcon from "@mui/icons-material/Close";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";

interface UsernameDialogProps {
    open: boolean;
    username: string;
    history:IHistory;
    onSubmit: (username:string, history:IHistory) => void;
    onUsernameDelete: (history:IHistory, target:string) => Promise<void>;
    onClose: (history:IHistory) => void;
}

const errorMessage = "You should input username";

const SearchDialog = (props:UsernameDialogProps) => {

    const contentRef :RefObject<HTMLDivElement> = createRef();
    const inputRef :RefObject<HTMLInputElement> = createRef();

    const [hasError, setHasError] = useState(false);

    const [username, setUsername] = useState(props.username);
    useEffect(() => {
        setUsername(props.username)
    },[props.username])

    const [history, setHistory] = useState<IHistory>({});
    useEffect(() => {
        setHistory(props.history)
    },[props.history])

    const onSubmit = () => {

        if(username){
            setHasError(false);
            props.onSubmit(username, history)
        }else{
            setHasError(true);
        }
    }

    const clearText = () => {
        setUsername("");
        inputRef.current?.focus();
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handleClickHistory = (clickedUsername:string) => {
        setUsername(clickedUsername);
        if(contentRef.current) contentRef.current.scrollTop = 0;
    }

    const deleteHistory = async (e: MouseEvent, username:string) => {

        e.stopPropagation();

        const newHistory = {...history}
        delete newHistory[username]

        await props.onUsernameDelete(newHistory, username);

        setHistory(newHistory)

    }

    const closeDialog = () => {
        props.onClose(history);
    }

    const renderListItem = (key:string) => {

        if(!props.open) return (null)

        return (
            <ListItem key={key} onClick={() => handleClickHistory(key)}>
                <div style={{display:"flex", alignItems:"center", justifyContent: "center", width: "100%"}}>
                    <Avatar alt={history[key].username} src={history[key].profileImage} style={{marginRight:"15px"}}/>
                    <div style={{flex: 1, display:"flex", flexDirection: "column", justifyContent: "center" }}>
                        <span>{history[key].name}</span>
                        <span>{history[key].username}</span>
                    </div>
                    <LinkButton size="small" edge="end" onClick={(e:any) => deleteHistory(e,key)}>
                        <DeleteIcon />
                    </LinkButton>
                </div>
            </ListItem>
        )

    }

    return (
        <Dialog style={{zIndex:1300}} open={props.open}>
            <AppBar style={{ height: "45px", display:"flex", justifyContent: "center", alignItems:"center" }}>
                <LinkButton style={{color:"inherit", position: "absolute", left:"5px"}} onClick={closeDialog}>
                    <CloseIcon />
                </LinkButton>
                <Typography variant="h6">Search</Typography>
            </AppBar>
            <DialogContent style={{marginTop:"30px"}} ref={contentRef}>
                <TextField
                    type="text"
                    error={hasError}
                    label="Username"
                    value={username}
                    autoFocus={true}
                    autoComplete={false}
                    onChange={handleChange}
                    inputRef={inputRef}
                    endAdornment={(
                        <LinkButton size="small" onClick={clearText}>
                              <ClearIcon fontSize="small"/>
                        </LinkButton>
                    )}
                    helperText={hasError ? errorMessage : ""}
                />
                <div style={{display:"flex", justifyContent:"center", marginTop:"30px"}}>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button onClick={onSubmit}>Submit</Button>
                </div>
                <div style={{marginTop:"30px"}}>
                    <List>
                        {Object.keys(history).map(item => renderListItem(item))}
                    </List>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SearchDialog;