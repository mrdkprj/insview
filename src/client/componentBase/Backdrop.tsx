import {css} from "@emotion/react";
import { useState, useEffect } from "react";

const Backdrop = ({...props}) => {

    const [_open, _setOpen] = useState(false);
    useEffect(() => {
        _setOpen(props.open)
    },[props.open])

    if(!_open) return (null)

    return (
        <div css={root} style={props.style} >{props.children}</div>
    )
}

const root = css({
    position: "fixed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    inset: "0px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
})

export default Backdrop;