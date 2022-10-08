import {css} from "@emotion/react";
import {forwardRef} from "react"

type DialogContentProps = {
    style: React.CSSProperties,
    children:any,
}
const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>((props, ref) => {
    return (
        <div css={root} style={props.style} ref={ref}>{props.children}</div>
    )
})

const root = css({
    flex: "1 1 auto",
    overflowY: "auto",
    padding: "20px 24px",
});

export default DialogContent;