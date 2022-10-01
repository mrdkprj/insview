import {css} from "@emotion/react";

const DialogContent = ({...props}) => {

    return (
        <div css={root} style={props.style}>{props.children}</div>
    )
}

const root = css({
    flex: "1 1 auto",
    overflowY: "auto",
    padding: "20px 24px",
});

export default DialogContent;