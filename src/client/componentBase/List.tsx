import {css} from "@emotion/react";

const List = ({...props}) => {

    return (
        <ul css={ul}>{props.children}</ul>
    )
}

const ul = css({
    listStyle:"none",
    margin:0,
    padding: "8px 0px",
    position: "relative"
});

export default List;