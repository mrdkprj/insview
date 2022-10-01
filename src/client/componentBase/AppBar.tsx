import {css} from "@emotion/react";

const AppBar = ({...props}) => {

    return (
        <header css={root} style={props.style}>{props.children}</header>
    )
}

const root = css({
    transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    boxShadow: "rgb(0 0 0 / 20%) 0px 2px 4px -1px, rgb(0 0 0 / 14%) 0px 4px 5px 0px, rgb(0 0 0 / 12%) 0px 1px 10px 0px",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    boxSizing: "border-box",
    flexShrink: "0",
    zIndex: "1100",
    top: "0px",
    left: "auto",
    right: "0px",
    backgroundColor: "rgb(25, 118, 210)",
    color: "rgb(255, 255, 255)",
    position: "relative"
});

export default AppBar;