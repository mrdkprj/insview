import {css} from "@emotion/react";

const onClickHandler = () => undefined

const LinkButton = ({...props}) => {

    const styles = [root];

    if(props.size === "small") styles.push(small)

    if(props.size === "medium") styles.push(medium)

    if(props.edge === "start") styles.push(start)

    if(props.edge === "end") styles.push(end)

    const onClickFn = props.onClick ? props.onClick : onClickHandler

    return (
        <button css={styles} style={props.style} onClick={onClickFn}>{props.children}</button>
    )
}

const root = css({
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
    textAlign: "center",
    flex: "0 0 auto",
    borderRadius: "50%",
    overflow: "visible",
    color: "rgba(0, 0, 0, 0.54)",
    transition: "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    fontSize: "1.125rem"
})

const small = css({
    padding: "5px",
})

const medium = css({
    padding: "8px"
})

const start = css({
    margin: "0px 0px 0px -12px"
})

const end = css({
    margin: "0px -3px 0px 0px"
})

export default LinkButton;