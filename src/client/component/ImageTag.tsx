import React, { useState, useEffect,useCallback } from "react"
import { css } from "@emotion/react";
import { IUser } from "@shared";

type ImageTagProps = {
    tags:any[],
    open:boolean,
}

const ImageTag = (props:ImageTagProps) => {

    const [_open, _setOpen] = useState(props.open);

    useEffect(()=>{
        console.log("--------")
        console.log(props.open)
        console.log("--------")
        _setOpen(props.open)
    },[props.open])

    const onTagClick = () => {
        return null;
    }

    if(!_open) return (null);

    return (
        <div css={edge}>
            {props.tags.map((tag:any) => (<div key={tag.id} onClick={onTagClick}>tag.username</div>))}
        </div>
    )
}



const edge = css({
    position:"fixed",
    margin:0,
    padding:0,
    opacity: 0,
    bottom:"3em",
    left:"10px",
    zIndex:2000,
    width:"100%",
    height:"100%x",
    display:"flex",
    justifyContent: "flex-start",
    alignItems:"self-start",
    flexDirection:"column",
    transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    "& div" : {
        letterSpacing:"0.02857em",
        margin:"5px 5px 5px 0px",
        padding: "5px",
        color:"#fff",
        borderRadius: "5px",
        backgroundColor:"rgb(25, 118, 210)",
    }
})
export default ImageTag;