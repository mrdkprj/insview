import {css} from "@emotion/react";

const Button = ({...props}) => {

    return (
        <button type="button" onClick={props.onClick} css={btn}>{props.children}</button>
    )
}

const btn = css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxSizing: "border-box",
    backgroundColor: "transparent",
    outline: "0px",
    border: "0px",
    margin: "0px",
    cursor: "pointer",
    userSelect: "none",
    verticalAlign: "middle",
    appearance: "none",
    textDecoration: "none",
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "500",
    fontSize: "0.875rem",
    lineHeight: "1.75",
    letterSpacing: "0.02857em",
    textTransform: "uppercase",
    minWidth: "64px",
    padding: "6px 8px",
    borderRadius: "4px",
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "rgb(25, 118, 210)",
});

export default Button;