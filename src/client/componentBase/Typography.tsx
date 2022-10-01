import {css} from "@emotion/react";

const Typography = ({...props}) => {

    const typoStyles = props.variant === "subtitle1" ? subtitle1 : h6

    return (
        <div css={typoStyles} style={props.style}>{props.children}</div>
    )
}

const subtitle1 = css({
    margin: "0px",
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "400",
    fontSize: "1rem",
    lineHeight: "1.75",
    letterSpacing: "0.00938em",
})

const h6  = css({
    margin: "0px",
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "500",
    fontSize: "1.25rem",
    lineHeight: "1.6",
    letterSpacing: "0.0075em",
})

export default Typography;