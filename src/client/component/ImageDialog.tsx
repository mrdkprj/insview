import React, { memo, useEffect,useCallback, useRef } from "react"
import { FixedSizeList as List } from 'react-window';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { css } from "@emotion/react";
import { IMedia, IUser } from "@shared";
import LinkButton from "@parts/LinkButton";

interface ImageDialogProps {
    width:number;
    height:number;
    data:IMedia[];
    startIndex:number;
    onClose:() => void;
    onImageRendered: (index:number) => void;
    onUserTagClick: (user:IUser) => void;
}

interface ISwipeState {
    startX: number;
    startY: number;
    startTime: number;
    moveY: number;
    moveX:number;
    isMoved:boolean;
    swiping: boolean;
    close: boolean;
    direction: string;
    left:number;
    degree:number;
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

const H_THRESHHOLD = 0.6
const H_SWIPE_ELAPSE = 150
const V_THRESHHOLD = 0.3
const SCALE = 3;
const DIRECTION = {
    right:"right",
    left:"left",
    up: "up",
    down:"down",
}

const getDirection = (xDiff:number,yDiff:number) => {

    if( Math.abs( xDiff ) > Math.abs( yDiff ) ){

        if( xDiff > 0 ){
            return DIRECTION.left;
        }

        return DIRECTION.right;
    }

    if( yDiff > 0 ){
        return DIRECTION.up
    }

    return DIRECTION.down;

}

const ImageDialog = (props:ImageDialogProps) => {

    const swipeState = useRef<ISwipeState>({...initialSwipeState});
    const imageRect = useRef<DOMRect | null>(null);
    const tapped = useRef<boolean>(false);
    const zoomed = useRef<boolean>(false);
    const timer = useRef<number>(0);
    const idealLeft = useRef<number>(0);

    const backRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null);

    const isHorizontalAction = () => {

        if(swipeState.current.direction === DIRECTION.right || swipeState.current.direction === DIRECTION.left){
            return true;
        }

        return false;
    }

    const onSwipeStart = useCallback((e) => {

        swipeState.current.startX = e.touches[0].clientX + listRef.current?.scrollLeft
        swipeState.current.startY = e.touches[0].clientY
        swipeState.current.startTime = new Date().getTime();
        swipeState.current.swiping = true
        swipeState.current.left = listRef.current?.scrollLeft ?? 0

    },[])

    const cleanupSwipe = useCallback(() => {
        swipeState.current = {...initialSwipeState};
    },[]);

    const closeDialog = useCallback(() => {
        cleanupSwipe();
        props.onClose();
    },[cleanupSwipe, props])

    const endSwipeHorizontal = useCallback(() => {

        const forceSwipe = swipeState.current.isMoved && new Date().getTime() - swipeState.current.startTime <= H_SWIPE_ELAPSE

        if(forceSwipe || swipeState.current.degree > H_THRESHHOLD){

            idealLeft.current = swipeState.current.direction === DIRECTION.left ? swipeState.current.left + props.width : swipeState.current.left - props.width
            listRef.current?.scrollTo({ left:idealLeft.current, behavior: "smooth" })

        }else{

            idealLeft.current = swipeState.current.left
            if(listRef.current) listRef.current.scrollLeft = idealLeft.current;

        }

        setTimeout(() => {
            if(listRef.current && listRef.current.scrollLeft !== idealLeft.current){
                listRef.current.scrollLeft = idealLeft.current;
            }
        }, 150);

        cleanupSwipe();

    },[cleanupSwipe, props.width])

    const endSwipeVertical = useCallback(() => {

        const forceSwipe = swipeState.current.close || swipeState.current.isMoved && new Date().getTime() - swipeState.current.startTime <= H_SWIPE_ELAPSE

        if(forceSwipe || swipeState.current.degree > V_THRESHHOLD){

            closeDialog();

        }else{

            cleanupSwipe();

            if(listRef.current) listRef.current.style.transform = `translate(${0}px, ${0}px)`

        }

    },[closeDialog, cleanupSwipe])

    const onSwipeEnd = useCallback(() => {

        if(!swipeState.current.swiping) return;


        if(isHorizontalAction()){
            endSwipeHorizontal();
        }else{
            endSwipeVertical();
        }

    },[endSwipeVertical, endSwipeHorizontal]);


    const slideHorizontal = useCallback(() => {

        const degree = (swipeState.current.moveX - swipeState.current.left) / props.width;
        swipeState.current.degree = Math.abs(degree);
        swipeState.current.isMoved = swipeState.current.degree > 0
        listRef.current?.scrollTo({ left: swipeState.current.moveX})

        if(swipeState.current.degree > H_THRESHHOLD){
            endSwipeHorizontal();
        }
    }, [endSwipeHorizontal, props.width])

    const slideVertical = useCallback(() => {

        swipeState.current.degree = Math.abs(swipeState.current.moveY) / props.height;

        swipeState.current.isMoved = swipeState.current.degree > 0

        if(swipeState.current.degree > V_THRESHHOLD){
            swipeState.current.close = true;
        }

        if(listRef.current){
            listRef.current.style.transform = `translate(0px, ${-swipeState.current.moveY}px)`
        }

    },[props.height])

    const onSwipeMove = useCallback((e) => {

        if(!swipeState.current.swiping || zoomed.current) return;

        hideTags();

        const xDiff = swipeState.current.startX - e.touches[0].clientX;
        const yDiff = swipeState.current.startY - e.touches[0].clientY;

        if(!swipeState.current.direction){
            swipeState.current.direction = getDirection(xDiff - swipeState.current.left, yDiff);
        }

        swipeState.current.moveY = yDiff
        swipeState.current.moveX = xDiff

        if(isHorizontalAction()){
            slideHorizontal();
        }else{
            slideVertical();
        }

    },[slideHorizontal, slideVertical]);

    const changeScale = useCallback( (e:React.MouseEvent<HTMLImageElement>) => {

        if(!listRef.current) return;

        const img = e.currentTarget;
        imageRect.current = img.getBoundingClientRect();

        if(zoomed.current){
            cleanupSwipe();
            img.style["transform"] = "scale(1)"
            zoomed.current = false
        }else{

            const x = e.pageX - imageRect.current.left;
            let y = e.pageY - imageRect.current.top;

            const nextTop = imageRect.current.top - y * 2
            const nextBottom = (imageRect.current.top + imageRect.current.height * SCALE) - y * 2

            if(nextTop > 0){
                y = imageRect.current.top / 2;
            }else if(nextBottom < window.screen.height){
                y = imageRect.current.height - imageRect.current.top / 2
            }

            img.style.transformOrigin = `${x}px ${y}px`
            img.style["transform"] = `scale(${SCALE})`

            zoomed.current = true;

        }

    },[cleanupSwipe])

    const onImageClick = useCallback((e:React.MouseEvent<HTMLImageElement>) => {

        if(!tapped.current) {

            tapped.current = true;

            timer.current = window.setTimeout(() => {
                tapped.current = false;
            }, 300 );

            return;
        }

        clearTimeout(timer.current)
        tapped.current = false;

        hideTags()

        changeScale(e)

    },[changeScale])

    const handleKeydown = useCallback((e:KeyboardEvent) => {

        if(e.key === "Escape"){
            closeDialog();
        }

    },[closeDialog]);

    const hideTags = () => {

        if(!listRef.current) return;

        if(listRef.current.classList.contains("tags")){
            listRef.current.classList.remove("tags")
        }
    }

    const toggleTags = () => {

        if(!listRef.current) return;

        if(listRef.current.classList.contains("tags")){
            hideTags();
        }else{
            listRef.current.classList.add("tags")
        }

    }

    const onTagClick = (tag:IUser) => {
        props.onUserTagClick(tag);
    }

    const onItemsRendered = ({visibleStartIndex}:{visibleStartIndex:number}) => {

        if(swipeState.current.swiping) return;

        props.onImageRendered(visibleStartIndex)

        if(!listRef.current) return;

        if(props.data[visibleStartIndex].taggedUsers.length > 0){
            listRef.current.classList.add("has-tags")
        }else{
            listRef.current.classList.remove("has-tags")
        }

    }

    const renderRow = ({index, style}:{index:number, style:React.CSSProperties}) => {

        const tags = props.data[index].taggedUsers ? props.data[index].taggedUsers : []
        return (
            <div style={style} css={ImageContainer}>
                <div css={edge}>
                    {tags.map((tag:IUser) => (<div key={tag.id} onClick={() => onTagClick(tag)}>{tag.username}</div>))}
                </div>
                {props.data[index].isVideo
                    ? <video css={ImageViewer} src={props.data[index].media_url} controls/>
                    : <img css={ImageViewer} alt={props.data[index].id} src={props.data[index].media_url} onClick={onImageClick}/>
                }
            </div>
        )

    }

    useEffect(() => {

        document.body.style.overflow = "hidden";

        listRef.current?.addEventListener("touchstart", onSwipeStart, { passive: true });
        listRef.current?.addEventListener("touchmove", onSwipeMove, { passive: true });
        listRef.current?.addEventListener("touchend", onSwipeEnd, { passive: true });

        document.addEventListener("keydown", handleKeydown);

        return (() => {
            document.removeEventListener("keydown", handleKeydown);
        });

    }, [onSwipeStart,onSwipeMove,onSwipeEnd,handleKeydown]);

    useEffect( () => () =>  {document.body.style.overflow = ""}, [] );

    return (
        <div css={Backdrop} ref={backRef}>
            <List
                height={props.height}
                itemCount={props.data.length}
                itemSize={props.width}
                width={props.width}
                layout="horizontal"
                overscanCount={4}
                outerRef={listRef}
                itemData={props.data}
                initialScrollOffset={props.width * (props.startIndex * 1)}
                style={{overflow:"hidden", background:"#121111", WebkitTransform :"translateZ(0px)"}}
                onItemsRendered={onItemsRendered}
            >
                {renderRow}
            </List>
            <span css={tags}>
                <LinkButton onClick={toggleTags}>
                    <AccountCircleIcon sx={{ color: "rgb(135 129 129)", mr: 1, my: 0.5 }} />
                </LinkButton>
            </span>
        </div>
    )

}

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
    userSelect: "none"
});

const edge = css({
    position:"absolute",
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
    },
    ".tags &" : {
        opacity:1,
    }
})

const tags = css({
    position:"fixed",
    bottom:"5px",
    left:"5px",
    display: "none",
    ".has-tags + &": {
        display: "inline-flex"
    }
})

export default memo(ImageDialog);
