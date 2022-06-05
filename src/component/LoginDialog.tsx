import React, {useState} from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import TextField from "@mui/material/TextField";
import DialogContent from "@mui/material/DialogContent";

export interface IUsernameDialogProps {
    open:boolean,
    onSubmit: (username:string, password:string) => void,
    onClose: () => void,
}

const LoginDialog = (props:IUsernameDialogProps) => {

    const [hasError, setHasError] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    let errorMessage = "You should input username/password";

    const onSubmit = () => {

        if(username && password){
            setHasError(false);
            props.onSubmit(username, password)
        }else{
            setHasError(true);
        }
    }

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

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
                        onClick={props.onClose}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">Authenticate</Typography>
                </Toolbar>
            </AppBar>
            <DialogContent sx={{marginTop:"30px"}}>
                <form>
                    <TextField
                        error={hasError}
                        inputProps={{ spellCheck: "false" }}
                        autoComplete="off"
                        margin="dense"
                        label="Username"
                        fullWidth
                        variant="standard"
                        value={username}
                        onChange={handleUsernameChange}
                        helperText={hasError ? errorMessage : ""}
                    />
                    <TextField
                        type={"password"}
                        error={hasError}
                        inputProps={{ spellCheck: "false" }}
                        autoComplete="off"
                        margin="dense"
                        label="Password"
                        fullWidth
                        variant="standard"
                        value={password}
                        onChange={handlePasswordChange}
                        helperText={hasError ? errorMessage : ""}
                    />
                    <div style={{display:"flex", justifyContent:"center", marginTop:"30px"}}>
                        <Button onClick={props.onClose}>Cancel</Button>
                        <Button onClick={onSubmit}>Login</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default LoginDialog;