import {css} from "@emotion/react";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';
import LinkButton from "@parts/LinkButton"
import { useEffect, useCallback, useState, useRef, createRef } from "react";

type SnackbarProps = {
    open:boolean,
    autoHideDuration:number,
    style:React.CSSProperties,
    childStyle:React.CSSProperties,
    children:any,
    onClose: () => void,
}

const Snackbar = (props:SnackbarProps) => {

    const displayTimer = useRef(0);
    const autoHideTimer = useRef(0);
    const hideTimer = useRef(0);
    const formRef :React.RefObject<HTMLDivElement> = createRef();

    const [_open, _setOpen] = useState(props.open)

    const hide = useCallback(() => {

        clearTimeout(autoHideTimer.current);
        clearTimeout(hideTimer.current);

        hideTimer.current = window.setTimeout(() => {
            if(formRef.current){
                formRef.current.style.opacity = ""
                formRef.current.style.transform = "scale(0)"
            }
        }, 200);

    },[formRef])

    const display = useCallback(() => {

        clearTimeout(displayTimer.current);

        displayTimer.current = window.setTimeout(() => {
            if(formRef.current){
                formRef.current.style.opacity = "1"
                formRef.current.style.transform = "none"
            }
        }, 250)

    },[formRef])

    const setAutoHideTimer = useCallback(() => {

        clearTimeout(autoHideTimer.current);

        autoHideTimer.current = window.setTimeout(() => {
            hide()
        }, props.autoHideDuration);

    },[hide, props.autoHideDuration])

    useEffect(() => {

        _setOpen(props.open)

    },[props.open])

    useEffect(() => {
        console.log("ef")
        if(_open){
            display();
            setAutoHideTimer();
        }

    },[_open, display, setAutoHideTimer])

    useEffect( () => () => hide(), [hide] );

    if(!_open) return (null);

    return (
        <div css={root} style={props.style}>
            <div css={alert} style={props.childStyle} ref={formRef}>
                <div css={icon}><ErrorOutlineIcon fontSize="inherit" color="inherit"/></div>
                <div css={msg}>{props.children}</div>
                <div css={action}>
                    <LinkButton size="small" onClick={props.onClose} style={{color: "inherit"}}>
                        <CloseIcon fontSize="small" color="inherit"/>
                    </LinkButton>
                </div>
            </div>
        </div>
    )
}

const root = css({
    position: "fixed",
    display: "flex",
    left: "8px",
    right: "8px",
    justifyContent: "center",
    alignItems: "center",
    top:"8px",
    "@media(min-width: 600px)" : {
        top:"24px",
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)"
    },
})

const alert = css({
    transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    opacity:0,
    borderRadius: "4px",
    boxShadow: "rgb(0 0 0 / 20%) 0px 3px 5px -1px, rgb(0 0 0 / 14%) 0px 6px 10px 0px, rgb(0 0 0 / 12%) 0px 1px 18px 0px",
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "500",
    fontSize: "0.875rem",
    lineHeight: "1.43",
    letterSpacing: "0.01071em",
    backgroundColor: "rgb(211, 47, 47)",
    display: "flex",
    padding: "6px 16px",
    color: "rgb(255, 255, 255)",
})

const icon = css({
    marginRight: "12px",
    padding: "7px 0px",
    display: "flex",
    fontSize: "22px",
    opacity: "0.9"
})

const msg = css({
    padding: "8px 0px"
})

const action = css({
    display: "flex",
    alignItems: "flex-start",
    padding: "4px 0px 0px 16px",
    marginLeft: "auto",
    marginRight: "-8px"
})

export default Snackbar;