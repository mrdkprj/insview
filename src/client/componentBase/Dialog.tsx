import {css} from "@emotion/react";
import { useEffect, useState, useRef, useCallback } from "react";

type DialogProps = {
    style?: React.CSSProperties,
    children?: any,
    open:boolean,
}

const Dialog = (props:DialogProps) => {

    const hideTimer = useRef(0);
    const ref = useRef<HTMLDivElement>(null)

    const [_open, _setOpen] = useState(props.open)

    const display = useCallback(() => {
        if(ref.current) ref.current.style.opacity = "1"
    },[])

    const hide = useCallback(() => {
        if(!ref.current) return

        ref.current.style.opacity = "0.8"

        clearTimeout(hideTimer.current);

        hideTimer.current = window.setTimeout(() => {
            if(ref.current) ref.current.style.opacity = "0"
        }, 200);

    },[])

    useEffect(() => {

        _setOpen(props.open)

    },[props.open])

    useEffect(() => {
        if(_open){
            display();
        }
    },[_open, display])

    useEffect( () => () => hide(), [hide] );

    if(!_open) return (null);

    return (
        <div css={root} style={props.style}>
            <div css={container} ref={ref}>
                <div css={paper}>{props.children}</div>
            </div>
        </div>
    )
}

const root = css({
    position: "fixed",
    inset: 0,
});

const container = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "0px",
    height: "100%",
    opacity: 0,
    transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms"
})

const paper = css({
    backgroundColor: "rgb(255, 255, 255)",
    color: "rgba(0, 0, 0, 0.87)",
    transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    boxShadow: "rgb(0 0 0 / 20%) 0px 11px 15px -7px, rgb(0 0 0 / 14%) 0px 24px 38px 3px, rgb(0 0 0 / 12%) 0px 9px 46px 8px",
    margin: "0px",
    position: "relative",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    maxHeight: "none",
    maxWidth: "100%",
    width: "100%",
    height: "100%",
    borderRadius: "0px"
})

export default Dialog;