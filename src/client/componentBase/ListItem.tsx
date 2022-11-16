import {css} from "@emotion/react";

const ListItem = ({...props}) => {

    return (
        <li css={li} onClick={props.onClick}>{props.children}</li>
    )
}

const li = css({
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    position: "relative",
    textDecoration: "none",
    width: "100%",
    boxSizing: "border-box",
    textAlign: "left",
    padding: "8px 16px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    backgroundClip: "padding-box",
    fontSize: "14px"
});

export default ListItem;