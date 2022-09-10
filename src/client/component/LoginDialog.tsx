import React, {useState, useEffect} from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import TextField from "@mui/material/TextField";
import PasswordIcon from '@mui/icons-material/Password';
import PinIcon from '@mui/icons-material/Pin';
import DialogContent from "@mui/material/DialogContent";

export interface IUsernameDialogProps {
    open:boolean,
    requireCode:boolean,
    onSubmit: (account:string, password:string) => Promise<void>,
    onCodeSubmit: (code:string) => Promise<void>,
    onClose: () => void,
}

const LoginDialog = (props:IUsernameDialogProps) => {

    const [hasError, setHasError] = useState(false);
    const [isChallenge, setIsChallenge] = useState(props.requireCode);

    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");

    const EMPTY_ID = "You should input username/password";
    const EMPTY_CODE = "You should input code"

    const onSubmit = () => {

        if(account && password){
            setHasError(false);
            props.onSubmit(account, password)
        }else{
            setHasError(true);
        }
    }

    const onSubmitCode = () => {
        if(code){
            props.onCodeSubmit(code);
        }else{
            setHasError(true);
        }
    }

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAccount(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCode(e.target.value);
    };

    const toggleDisplay = () => {
        setIsChallenge(!isChallenge);
    }

    useEffect(() =>{
        setIsChallenge(props.requireCode)
    },[props.requireCode])

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
                <IconButton edge="start" color="inherit" onClick={props.onClose}>
                        <CloseIcon />
                </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">Authenticate</Typography>
                    <IconButton edge="end" color="inherit" onClick={toggleDisplay}>
                        {isChallenge ? <PasswordIcon /> : <PinIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>
            <DialogContent sx={{marginTop:"30px"}}>
                {isChallenge ?
                    <form>
                        <TextField
                            type={"number"}
                            error={hasError}
                            inputProps={{ spellCheck: "false" }}
                            autoComplete="off"
                            margin="dense"
                            label="Code"
                            fullWidth
                            variant="standard"
                            value={code}
                            onChange={handleCodeChange}
                            helperText={hasError ? EMPTY_CODE : ""}
                        />
                        <div style={{display:"flex", justifyContent:"center", marginTop:"30px"}}>
                            <Button onClick={onSubmitCode}>Verify</Button>
                        </div>
                    </form>
                    :
                    <form>
                        <TextField
                            error={hasError}
                            inputProps={{ spellCheck: "false" }}
                            autoComplete="off"
                            margin="dense"
                            label="Username"
                            fullWidth
                            variant="standard"
                            value={account}
                            onChange={handleUsernameChange}
                            helperText={hasError ? EMPTY_ID : ""}
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
                            helperText={hasError ? EMPTY_ID : ""}
                        />
                        <div style={{display:"flex", justifyContent:"center", marginTop:"30px"}}>
                            <Button onClick={props.onClose}>Cancel</Button>
                            <Button onClick={onSubmit}>Login</Button>
                        </div>
                    </form>
                }
            </DialogContent>
        </Dialog>
    )
}

export default LoginDialog;
