import {RefObject, ChangeEvent, MouseEvent, useState, createRef,useEffect} from "react";
import { Button, Dialog, AppBar, Toolbar, InputAdornment, IconButton, Typography, TextField, DialogContent, List, ListItem, Avatar } from "@mui/material";
import {Close, Clear, Delete } from "@mui/icons-material";
import {IHistory} from "../../types";

export interface IUsernameDialogProps {
    open: boolean,
    username: string,
    history:IHistory,
    onSubmit: (username:string, history:IHistory) => void,
    onUsernameDelete: (history:IHistory, target:string) => Promise<void>,
    onClose: (history:IHistory) => void,
}

const UsernameDialog = (props:IUsernameDialogProps) => {

    const contentRef :RefObject<HTMLDivElement> = createRef();
    const inputRef :RefObject<HTMLInputElement> = createRef();

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

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handleClickHistory = (clickedUsername:string) => {
        setUsername(clickedUsername);
        if(contentRef.current) contentRef.current.scrollTop = 0;
    }

    const deleteHistory = async (e: MouseEvent, username:string) => {

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
                        <Delete />
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
                        <Close />
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
                                <Clear fontSize="small" onClick={clearText}/>
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