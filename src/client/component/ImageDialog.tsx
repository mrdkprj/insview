import React, { memo, useEffect,useCallback, useRef } from "react"
import { FixedSizeList as List } from 'react-window';
import { css } from "@emotion/react";
import { IMedia } from "@shared";

type ImageDialogProps = {
    width:number,
    height:number,
    data:IMedia[],
    startIndex:number,
    onClose:() => void,
    onImageRendered: (index:number) => void,
}

const direction = {
    right:"right",
    left:"left",
    up: "up",
    down:"down",
}

const initialSwipeState = {
    startX: 0,
    startY: 0,
    startTime:0,
    moveY: 0,
    moveX:0,
    isMoved:false,
    swiping: false,
    close:false,
    direction: "",
    left:0,
    degree:0,
}

let swipeState = {...initialSwipeState};

const H_THRESHHOLD = 0.6
const H_SWIPE_ELAPSE = 150
const V_THRESHHOLD = 0.15
const SCALE = 3;
let tapped = false;
let zoomed = false;
let timer = 0;
let imageRect = null;

const isHorizontalAction = () => {
    if(swipeState.direction === direction.right || swipeState.direction === direction.left){
        return true;
    }

    return false;
}

const getDirection = (xDiff:number,yDiff:number) => {

    if( Math.abs( xDiff ) > Math.abs( yDiff ) ){

        if( xDiff > 0 ){
            return direction.left;
        }

        return direction.right;
    }

    if( yDiff > 0 ){
        return direction.up
    }

    return direction.down;

}

const ImageDialog = (props:ImageDialogProps) => {

    const ref = useRef<HTMLDivElement>(null);

    const onTouchStart = useCallback((e) => {

        swipeState.startX = e.touches[0].clientX + ref.current?.scrollLeft
        swipeState.startY = e.touches[0].clientY
        swipeState.startTime = new Date().getTime();
        swipeState.swiping = true
        swipeState.left = ref.current?.scrollLeft ?? 0

    },[])

    const cleanupSwipe = useCallback(() => {
        swipeState = {...initialSwipeState};
    },[]);

    const closeDialog = useCallback(() => {
        cleanupSwipe();
        props.onClose();
    },[cleanupSwipe, props.onClose])

    const onTouchEnd = useCallback(() => {

        if(!swipeState.swiping) return;

        if(swipeState.close){
            closeDialog();
            return;
        }

        if(isHorizontalAction()){
            endSwipeHorizontal();
            return;
        }

        if(swipeState.direction === direction.down && Math.abs(swipeState.moveY) / 100 > V_THRESHHOLD){
            closeDialog();
            return;
        }

        cleanupSwipe();

        if(ref.current){
            ref.current.style.transform = `translate(${0}px, ${0}px)`
        }

    },[ref, closeDialog,cleanupSwipe]);

    const endSwipeHorizontal = () => {

        let left = swipeState.left;

        const forceSwipe = swipeState.isMoved && new Date().getTime() - swipeState.startTime <= H_SWIPE_ELAPSE

        if(forceSwipe || swipeState.degree > H_THRESHHOLD){
            left = swipeState.direction === direction.left ? swipeState.left + props.width : swipeState.left - props.width
        }

        ref.current?.scrollTo({ left, behavior: "smooth" })

        cleanupSwipe();

    }

    const onTouchMove = useCallback((e) => {

        e.preventDefault();

        if(!swipeState.swiping || zoomed) return;

        const xDiff = swipeState.startX - e.touches[0].clientX;
        const yDiff = swipeState.startY - e.touches[0].clientY;

        if(!swipeState.direction){
            swipeState.direction = getDirection(xDiff - swipeState.left, yDiff);
        }

        swipeState = {...swipeState, moveY: yDiff, moveX: xDiff};

        if(isHorizontalAction()){
            const degree = (swipeState.moveX - swipeState.left) / props.width;
            swipeState.degree = Math.abs(degree);
            swipeState.isMoved = swipeState.degree > 0
            ref.current?.scrollTo({ left: swipeState.moveX})

            if(swipeState.degree > H_THRESHHOLD){
                endSwipeHorizontal();
            }

            return;
        }

        swipeState.degree = Math.abs(swipeState.moveY) / props.height;

        if(swipeState.degree > V_THRESHHOLD){
            swipeState = {...swipeState, close:true}
        }

        if(ref.current){
            ref.current.style.transform = `translate(${0}px, ${-swipeState.moveY}px)`
        }

    },[getDirection]);

    const changeScale = useCallback( (e:React.MouseEvent<HTMLImageElement>) => {

        if(!ref.current) return;

        const img = e.currentTarget;
        imageRect = img.getBoundingClientRect();

        if(zoomed){
            cleanupSwipe();
            img.style["transform"] = "scale(1)"
            zoomed = false
        }else{

            const x = e.pageX - imageRect.left;
            let y = e.pageY - imageRect.top;

            const nextTop = imageRect.top - y * 2
            const nextBottom = (imageRect.top + imageRect.height * SCALE) - y * 2

            if(nextTop > 0){
                y = imageRect.top / 2;
            }else if(nextBottom < window.screen.height){
                y = imageRect.height - imageRect.top / 2
            }

            img.style.transformOrigin = `${x}px ${y}px`
            img.style["transform"] = `scale(${SCALE})`

            zoomed = true;

        }

    },[cleanupSwipe])

    const onImageClick = useCallback((e:React.MouseEvent<HTMLImageElement>) => {

        if(!tapped) {

            tapped = true;

            timer = window.setTimeout(() => {
                tapped = false;
            }, 300 );

            return;
        }

        clearTimeout(timer)
        tapped = false;

        changeScale(e)

    },[changeScale])

    const handleKeydown = useCallback((e:KeyboardEvent) => {

        if(e.key === "Escape"){
            closeDialog();
        }

    },[closeDialog]);

    const onItemsRendered = ({visibleStartIndex}:{visibleStartIndex:number}) => {

        if(swipeState.swiping) return;

        props.onImageRendered(visibleStartIndex)

    }

    const renderRow = ({index, style}:{index:number, style:React.CSSProperties}) => {

        return (
            <div style={style} css={ImageContainer}>
                <img css={ImageViewer} alt={props.data[index].id} src={props.data[index].media_url} onClick={onImageClick}/>
            </div>
        )

    }

    useEffect(() => {

        document.body.style.overflow = "hidden";

        ref.current?.addEventListener("touchstart", onTouchStart, { passive: true });
        ref.current?.addEventListener("touchmove", onTouchMove, { passive: false });
        ref.current?.addEventListener("touchend", onTouchEnd, { passive: true });

        document.addEventListener("keydown", handleKeydown);

        return (() => {
            document.removeEventListener("keydown", handleKeydown);
        });

    }, [onTouchStart,onTouchMove,onTouchEnd,handleKeydown, onImageClick]);

    useEffect( () => () =>  {document.body.style.overflow = ""}, [] );

    const ImageContainer = css({
        display:"flex",
        justifyContent: "flex-start",
        alignItems:"center",

    })
    const ImageViewer = css({
        maxHeight: "100%",
        maxWidth: "100%",
        transition: "transform 0.7s",
        willChange: "transform"
    });

    const Backdrop = css({
        position: "fixed",
        top:0,
        left: 0,
        overflow:"hidden",
        backgroundColor: "#2a2727d4",
        zIndex: 2000,
        height: "100%",
        width: "100%",
    });

    const Contaner = css({
        position: "fixed",
        top:0,
        left: 0,
        zIndex: 2000,
        height: "100%",
        width: "100%",
        background: "#121111",
        overflow: "hidden",
    });

    return (
        <div css={Backdrop}>
            <div css={Contaner}>
                <List
                    height={props.height}
                    itemCount={props.data.length}
                    itemSize={props.width}
                    width={props.width}
                    layout="horizontal"
                    overscanCount={4}
                    outerRef={ref}
                    itemData={props.data}
                    initialScrollOffset={props.width * (props.startIndex * 1)}
                    style={{overflow:"hidden", WebkitOverflowScrolling:"touch", WebkitTransform :"translateZ(0px)"}}
                    onItemsRendered={onItemsRendered}
                >
                    {renderRow}
                </List>
            </div>
        </div>
    )

}

export default memo(ImageDialog);
