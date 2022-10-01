import {css} from "@emotion/react";

const Backdrop = ({...props}) => {

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