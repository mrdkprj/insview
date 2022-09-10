import React, {useState, createRef,useEffect} from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import TextField from "@mui/material/TextField";
import DialogContent from "@mui/material/DialogContent";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import {IHistory} from "../../types";
import Avatar from "@mui/material/Avatar";

export interface IUsernameDialogProps {
    open: boolean,
    username: string,
    history:IHistory,
    onSubmit: (username:string, history:IHistory) => void,
    onUsernameDelete: (history:IHistory, target:string) => Promise<void>,
    onClose: (history:IHistory) => void,
}

const UsernameDialog = (props:IUsernameDialogProps) => {

    const contentRef :React.RefObject<HTMLDivElement> = createRef();
    const inputRef :React.RefObject<HTMLInputElement> = createRef();

    const [hasError, setHasError] = useState(false);
    const [username, setUsername] = useState(props.username);
    const [history, setHistory] = useState(props.history);

    let errorMessage = "You should input username";

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handleClickHistory = (clickedUsername:string) => {
        setUsername(clickedUsername);
        if(contentRef.current) contentRef.current.scrollTop = 0;
    }

    const deleteHistory = async (e: React.MouseEvent, username:string) => {

        e.stopPropagation();

        const {[username]: value, ...newHistory } = history;

        await props.onUsernameDelete(newHistory, username);

        setHistory(newHistory)

    }

    const closeDialog = () => {
        props.onClose(history);
    }

    const renderListItem = () => {

        return Object.keys(history).map((key:string) =>
            <ListItem
                onClick={() => handleClickHistory(key)}
                divider={true}
                sx={{fontSize:14}}
                secondaryAction={
                    <IconButton size="small" edge="end" aria-label="delete" onClick={(e) => deleteHistory(e,key)}>
                        <DeleteIcon />
                    </IconButton>
                }
            >
                <div style={{display:"flex", alignItems:"center"}}>
                    <Avatar alt={history[key].profileImage} src={history[key].profileImage} style={{marginRight:"15px"}}/>
                    <span>
                        {history[key].name}<br/>
                        {history[key].username}
                    </span>
                </div>
            </ListItem>
        );
    }

    useEffect(() => {

    },[])

    return (
        <Dialog
            sx={{zIndex:1300}}
            open={props.open}
            fullScreen
            disableEnforceFocus={true}
            disableAutoFocus={true}
            hideBackdrop={true}
        >
            <AppBar sx={{ position: "relative" }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={closeDialog}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">Input username</Typography>
                </Toolbar>
            </AppBar>
            <DialogContent sx={{marginTop:"30px"}} ref={contentRef}>
                <TextField
                    error={hasError}
                    inputProps={{ spellCheck: "false" }}
                    inputRef={inputRef}
                    autoComplete="off"
                    margin="dense"
                    label="Username"
                    fullWidth
                    variant="standard"
                    value={username}
                    onChange={handleChange}
                    InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                                <ClearIcon fontSize="small" onClick={clearText}/>
                          </InputAdornment>
                        ),
                      }}
                    helperText={hasError ? errorMessage : ""}
                />
                <div style={{display:"flex", justifyContent:"center", marginTop:"30px"}}>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button onClick={onSubmit}>Submit</Button>
                </div>
                <div style={{marginTop:"30px"}}>
                    <List>
                        {renderListItem()}
                    </List>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default UsernameDialog;