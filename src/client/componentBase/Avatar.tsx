import {css} from "@emotion/react";
import {useState} from "react"

const Avatar = ({...props}) => {

    const [loaded, setLoaded] = useState(true);

    const onImgError = () => {
        setLoaded(false);
    }

    const getInitial = (text:string) => {
        return text ? text.charAt(0) : "a"
    }

    return (
        <div css={root} style={props.style}>
            {loaded ?
                <img css={image} src={props.src} alt={props.alt} onError={onImgError} />
                :
                <div css={loadError}>{getInitial(props.alt)}</div>
            }

        </div>
    )
}

const root = css({
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "40px",
    height: "40px",
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontSize: "1.25rem",
    lineHeight: "1",
    borderRadius: "50%",
    overflow: "hidden",
    userSelect: "none"
})

const image = css({
    width: "100%",
    height: "100%",
    textAlign: "center",
    objectFit: "cover",
    color: "transparent",
    textIndent: "10000px"
})

const loadError = css({
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "40px",
    height: "40px",
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontSize: "1.25rem",
    lineHeight: "1",
    borderRadius: "50%",
    overflow: "hidden",
    userSelect: "none",
    color: "rgb(255, 255, 255)",
    backgroundColor: "rgb(189, 189, 189)"
})

export default Avatar;