import {ChangeEvent, useState, useEffect} from "react";
import Dialog from "@parts/Dialog"
import AppBar from "@parts/AppBar"
import LinkButton from "@parts/LinkButton"
import Typography from "@parts/Typography"
import DialogContent from "@parts/DialogContent"
import TextField from "@mui/material/TextField"
//"@parts/TextField"
import Button from "@parts/Button"
import CloseIcon from "@mui/icons-material/Close";
import PasswordIcon from "@mui/icons-material/Password";
import PinIcon from "@mui/icons-material/Pin";

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
            console.log(`onSubmit:${account} & ${password}`)
        }else{
            setHasError(true);
        }
    }

    const onSubmitCode = () => {
        if(code){
            setHasError(false);
            props.onCodeSubmit(code);
            console.log(`code:${code}`)
        }else{
            setHasError(true);
        }
    }

    const handleAccountChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAccount(e.target.value);
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCode(e.target.value);
    };

    const toggleDisplay = () => {
        setIsChallenge(!isChallenge);
    }

    useEffect(() =>{
        setIsChallenge(props.requireCode)
    },[props.requireCode])

    return (
        <Dialog style={{zIndex:1300}} open={props.open}>
            <AppBar style={{ height: "45px", display:"flex", justifyContent: "center", alignItems:"center" }}>
                <LinkButton style={{color:"inherit", position: "absolute", left:"5px"}} onClick={props.onClose}>
                    <CloseIcon />
                </LinkButton>
                <Typography variant="h6">Authenticate</Typography>
                <LinkButton style={{color:"inherit", position: "absolute", right:"5px"}} onClick={toggleDisplay}>
                    {isChallenge ? <PasswordIcon /> : <PinIcon />}
                </LinkButton>
            </AppBar>
            <DialogContent style={{marginTop:"30px"}}>
                {isChallenge ?
                    <form>
                        <TextField
                            type="number"
                            error={hasError}
                            label="Code"
                            value={code}
                            //disableFocus={true}
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
                            type="text"
                            error={hasError}
                            label="Username"
                            value={account}
                            //disableFocus={true}
                            onChange={handleAccountChange}
                            helperText={hasError ? EMPTY_ID : ""}
                        />
                        <TextField
                            type="password"
                            error={hasError}
                            label="Password"
                            value={password}
                            //disableFocus={true}
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
