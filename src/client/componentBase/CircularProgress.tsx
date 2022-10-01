import {css, keyframes} from "@emotion/react";

const CircularProgress = ({...props}) => {
    return (
        <span css={root}>
            <svg viewBox="22 22 44 44">
                <circle css={circle} cx="44" cy="44" r="20.2" fill="none" stroke-width="3.6"></circle>
            </svg>
        </span>
    )
}

const spanAnimation = keyframes({
    "0%" : {transform: "rotate(0deg)"},
    "100%": {transform: "rotate(360deg)"}
})

const root = css({
    display: "inline-block",
    width: "40px",
    height: "40px",
    animation: `1.4s linear 0s infinite normal none running ${spanAnimation}`,
})

const circleAnimation = keyframes({
    "0%" : {
        strokeDasharray: "1px, 200px",
        strokeDashoffset: 0
    },
    "50%" : {
        strokeDasharray: "100px, 200px",
        strokeDashoffset: "-15px"
    },
    "100%" : {
        strokeDasharray: "100px, 200px",
        strokeDashoffset: "-125px"
    }
})

const circle = css({
    stroke: "currentcolor",
    strokeDasharray: "80px, 200px",
    strokeDashoffset: "0",
    animation: `1.4s ease-in-out 0s infinite normal none running ${circleAnimation}`
})

export default CircularProgress;