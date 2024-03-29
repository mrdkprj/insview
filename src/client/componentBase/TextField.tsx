import React, {useEffect, createRef, useCallback, useState} from "react"
import {css, keyframes} from "@emotion/react";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LinkButton from "./LinkButton";

interface TextFieldProps {
    value:any;
    error:boolean;
    label:string;
    type:string;
    inputRef?:React.RefObject<HTMLInputElement>;
    onChange?: (e:React.ChangeEvent<HTMLInputElement>) => void;
    endAdornment?: JSX.Element;
    helperText?:string;
    autoFocus?:boolean;
    autoComplete?:boolean;
}

const TextField = (props:TextFieldProps) => {

    const formRef :React.RefObject<HTMLDivElement> = createRef();
    const inputRef :React.RefObject<HTMLInputElement> = props.inputRef ? props.inputRef : createRef();
    const [passwordVisible, setPasswordVisible] = useState(false);

    const _onChange = (e:React.ChangeEvent<HTMLInputElement>) => {

        _toggleFilled(inputRef.current?.value);

        props.onChange && props.onChange(e);

    }

    const _onFocus = () => {
        formRef.current?.classList.add("has-focus")
        formRef.current?.classList.remove("empty")
    }

    const _onBlur = () => {
        formRef.current?.classList.remove("has-focus")
        if(!inputRef.current?.value){
            formRef.current?.classList.add("empty")
        }
    }

    const _toggleFilled = useCallback((value:any) => {

        if(value || document.activeElement === inputRef.current){
            formRef.current?.classList.remove("empty")
        }else{
            formRef.current?.classList.add("empty")
        }

    },[formRef, inputRef])

    const _onAnimationStart = (e:React.AnimationEvent<HTMLInputElement>) => {

       if(e.animationName.endsWith("autoFillCancel")){
            _toggleFilled(inputRef.current?.value)
       }else{
            _toggleFilled("value")
       }

    }

    const _togglePassword = () => {

        if(!inputRef.current) return;

        setPasswordVisible(!passwordVisible)

        if(inputRef.current.type === "password"){
            inputRef.current.type = "text"
        }else{
            inputRef.current.type = "password"
        }
    }

    useEffect(() => {

        if(props.error){
            formRef.current?.classList.add("has-error")
        }else{
            formRef.current?.classList.remove("has-error")
        }

    },[formRef, props.error])

    useEffect(() => {

        _toggleFilled(props.value)

    },[formRef, props.value, _toggleFilled])

    return (
        <div ref={formRef} css={form}>
            <label css={label}>{props.label}</label>
            <div css={root}>
                <input
                    type={props.type}
                    autoComplete={props.autoComplete === false ? "new-password" : "on"}
                    spellCheck="false"
                    value={props.value}
                    css={input}
                    ref={inputRef}
                    onFocus={_onFocus}
                    onBlur={_onBlur}
                    onChange={_onChange}
                    onAnimationStart={_onAnimationStart}
                />
                { props.type === "password" && <LinkButton size="small" onClick={_togglePassword}> {passwordVisible ? <VisibilityOffIcon/> : <VisibilityIcon/>} </LinkButton>}
                { props.endAdornment && props.endAdornment }
            </div>
            { props.error && <p css={msg}>{props.helperText}</p> }
        </div>
    )
}

const form = css({
    display: "inline-flex",
    flexDirection: "column",
    position: "relative",
    minWidth: "0px",
    padding: "0px",
    margin: "8px 0px 4px",
    border: "0px",
    verticalAlign: "top",
    width: "100%",
});

const label = css({
    color: "rgba(0, 0, 0, 0.6)",
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "400",
    fontSize: "1rem",
    lineHeight: "1.4375em",
    letterSpacing: "0.00938em",
    padding: "0px",
    display: "block",
    transformOrigin: "left top",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "133%",
    position: "absolute",
    left: "0px",
    top: "0px",
    transform: "translate(0px, -1.5px) scale(0.75)",
    transition: "color 200ms cubic-bezier(0, 0, 0.2, 1) 0ms, transform 200ms cubic-bezier(0, 0, 0.2, 1) 0ms, max-width 200ms cubic-bezier(0, 0, 0.2, 1) 0ms",
    ".empty &" : {
        maxWidth: "100%",
        transform: "translate(0px, 20px) scale(1)",
    },
    ".has-focus &" : {
        color: "rgba(25,118,210)"
    },
    ".has-error &" : {
        color: "rgb(211, 47, 47)"
    }
})

const root = css({
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "400",
    fontSize: "1rem",
    lineHeight: "1.4375em",
    letterSpacing: "0.00938em",
    color: "rgba(0, 0, 0, 0.87)",
    boxSizing: "border-box",
    cursor: "text",
    display: "inline-flex",
    alignItems: "center",
    width: "100%",
    position: "relative",
    marginTop: "16px",
    "&:before" : {
        borderBottom: "1px solid rgba(0, 0, 0, 0.42)",
        left: "0px",
        bottom: "0px",
        content: '""',
        position: "absolute",
        right: "0px",
        transition: "border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        pointerEvents: "none"
    },
    "&:after" : {
        borderBottom: "2px solid rgb(25, 118, 210)",
        left: "0px",
        bottom: "0px",
        content: '""',
        position: "absolute",
        right: "0px",
        transform: "scaleX(0)",
        transition: "transform 200ms cubic-bezier(0, 0, 0.2, 1) 0ms",
        pointerEvents: "none"
    },
    ".has-focus &:after" : {
        transform: "scaleX(1)",
    },
    ".has-error &:after" : {
        borderBottomColor: "rgb(211, 47, 47)",
        transform: "scaleX(1)",
    }
})

const autoFillCancel = keyframes({
    "from":{
        display: "block"
    },
    label: "autoFillCancel"
})

const autoFill = keyframes({
    "from":{
        display: "block"
    },
    label: "autoFill"
})

const input = css({
    font: "inherit",
    letterSpacing: "inherit",
    color: "currentcolor",
    padding: "4px 0px 5px",
    border: "0px",
    boxSizing: "content-box",
    background: "none",
    height: "1.4375em",
    margin: "0px",
    display: "block",
    minWidth: "0px",
    width: "100%",
    WebkitTapHighlightColor: "transparent",
    animationName: `${autoFillCancel}`,
    animationDuration: "10ms",
    "&:focus" : {
        outline: "0px"
    },
    "&:-webkit-autofill":{
        animationDuration: "5000s",
        animationName: `${autoFill}`
    }
})

const msg = css({
    color: "rgba(0, 0, 0, 0.6)",
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "400",
    fontSize: "0.75rem",
    lineHeight: "1.66",
    letterSpacing: "0.03333em",
    textAlign: "left",
    margin: "3px 0px 0px",
    ".has-error &" : {
        color: "rgb(211, 47, 47)",
    }
})

export default TextField;