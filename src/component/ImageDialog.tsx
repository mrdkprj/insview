import React, { memo, useEffect,useCallback, useRef } from "react"
import { styled } from "@mui/system";

const direction = {
    right:"right",
    left:"left",
    up: "up",
    down:"down",
}

let swipeState = {
    startX: 0,
    startY: 0,
    moveY: 0,
    moveX:0,
    swiping: true,
    close:false,
    direction: "",
}

const imagePosition = {
    x:0,
    y:0,
    moveX:0,
    moveY:0,
}

const SCALE = 3;
let tapped :boolean = false;
let zoomed = false;
let rect :any = null;
let containerRect :any = null
let timer :any = null;

const isHorizontalAction = () => {
    if(swipeState.direction === direction.right || swipeState.direction === direction.left){
        return true;
    }

    return false;
}

const ImageDialog = ({mediaUrl,onClose,mediaId}:{mediaUrl:string,onClose:() => void,mediaId:string}) => {

    const ref = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const getDirection = useCallback((xDiff,yDiff) => {

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

    },[])

    const onTouchStart = useCallback((e) => {

        swipeState = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            moveY: 0,
            moveX:0,
            swiping: true,
            close:false,
            direction: "",
        }

    },[])

    const cleanupSwipe = useCallback(() => {

        swipeState = {
            startX: 0,
            startY: 0,
            moveY: 0,
            moveX:0,
            swiping: false,
            close:false,
            direction:"",
        }

        imagePosition.x = 0;
        imagePosition.y = 0;
        imagePosition.moveX = 0
        imagePosition.moveY = 0

    },[]);

    const closeDialog = useCallback(() => {
        cleanupSwipe();
        onClose();
    },[cleanupSwipe, onClose])

    const onTouchEnd = useCallback((e) => {

        if(!swipeState.swiping) return;

        if(swipeState.close){
            closeDialog();
            return;
        }

        if(swipeState.direction === direction.down && Math.abs(swipeState.moveY) / 100 > 0.15){
            closeDialog();
            return;
        }

        cleanupSwipe();

        if(ref.current){
            ref.current.style.transform = `translate(${0}px, ${0}px)`
        }

    },[ref, closeDialog,cleanupSwipe]);

    const onTouchMove = useCallback((e) => {

        e.preventDefault();

        if(!swipeState.swiping && !zoomed) return;

        const xDiff = swipeState.startX - e.touches[0].clientX;
        const yDiff = swipeState.startY - e.touches[0].clientY;

        if(zoomed && imageRef.current){

            const imgBoundRecttop = Math.max((rect.height * SCALE - containerRect.height),0) / 3;
            const imgBoundRectleft = Math.max((rect.width * SCALE - containerRect.width),0) / 3;

            const dx = e.touches[0].clientX - swipeState.startX
            const dy = e.touches[0].clientY - swipeState.startY

            swipeState.startX = e.touches[0].clientX;
            swipeState.startY = e.touches[0].clientY;

            if(imagePosition.y + dy > 0 || imagePosition.y + dy < imgBoundRecttop * -1){

            }else{
                imagePosition.y += dy;
                imagePosition.moveY += dy;
            }

            if(imagePosition.x + dx > 0 || imagePosition.x + dx < imgBoundRectleft * -1){

            }else{
                imagePosition.x += dx;
                imagePosition.moveX += dx;
            }

            imageRef.current.style["transform"] = `scale(${SCALE}) translate(${imagePosition.moveX}px, ${imagePosition.moveY}px`

            return;
        }

        if(!swipeState.direction){
            swipeState.direction = getDirection(xDiff,yDiff);
        }

        swipeState = {...swipeState, moveY: yDiff, moveX: xDiff};

        if(isHorizontalAction()){
            return;
        }

        if(swipeState.direction !== direction.down) return;

        if(Math.abs(swipeState.moveY) / 100 > 0.15){
            swipeState = {...swipeState, close:true}
        }

        if(ref.current){
            ref.current.style.transform = `translate(${0}px, ${-swipeState.moveY}px)`
        }

    },[getDirection]);

    const changeScale = useCallback( (e:MouseEvent) => {

        if(!imageRef.current || !ref.current) return;

        if(zoomed){
            cleanupSwipe();
            imageRef.current.style["transform"] = "scale(1) translate(0px, 0px)"
            zoomed = false
        }else{

            let x = e.pageX - rect.left;
            let y = e.pageY - rect.top;

            const nextTop = rect.top - y * 2
            const nextBottom = (rect.top + rect.height * SCALE) - y * 2
            imagePosition.x = (rect.left - x * 2) / 3

            if(nextTop > 0){
                imagePosition.y = 0;
                y = rect.top / 2;
            }else if(nextBottom < window.screen.height){
                imagePosition.y = window.screen.height - rect.height * SCALE
                y = rect.height - rect.top / 2
            }else{
                imagePosition.y = (rect.top - y * 2) / 3
            }

            imageRef.current.style["transform-origin" as any] = `${x}px ${y}px`
            imageRef.current.style["transform"] = `scale(${SCALE}) translate(0px, 0px)`

            zoomed = true;

        }

    },[cleanupSwipe])

    const onImageClick = useCallback((e:MouseEvent) => {

        if(!tapped) {

            tapped = true;

            timer = setTimeout(() => {
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

    useEffect(() => {

        document.body.style.overflow = "hidden";

        ref.current?.addEventListener("touchstart", onTouchStart, { passive: false });
        ref.current?.addEventListener("touchmove", onTouchMove, { passive: false });
        ref.current?.addEventListener("touchend", onTouchEnd);
        imageRef.current?.addEventListener("click", onImageClick, { passive: false });
        document.addEventListener("keydown", handleKeydown, { passive: false });

        rect = imageRef.current?.getBoundingClientRect();
        containerRect = ref.current?.getBoundingClientRect();

        return (() => {
            document.removeEventListener("keydown", handleKeydown);
        });

    }, [onTouchStart,onTouchMove,onTouchEnd,handleKeydown, onImageClick]);

    useEffect( () => () =>  {document.body.style.overflow = ""}, [] );

    const ImageViewer = styled("img")({
        maxHeight: "100%",
        maxWidth: "100%",
        transition: "transform 0.7s",
        willChange: "transform"
    });

    const Backdrop = styled("div")({
        position: "fixed",
        top:0,
        left: 0,
        overflow:"hidden",
        backgroundColor: "#2a2727d4",
        zIndex: 2000,
        height: "100%",
        width: "100%",
    });

    const Contaner = styled("div")({
        display:"flex",
        justifyContent: "center",
        alignItems:"center",
        flex: 1,
        position: "fixed",
        transform: "translate(0px, 0px)",
        top:0,
        left: 0,
        zIndex: 2000,
        height: "100%",
        width: "100%",
        background: "#121111",
    });


    return (
        <Backdrop>
            <Contaner ref={ref}>
                <ImageViewer ref={imageRef} alt={mediaId} src={mediaUrl}/>
            </Contaner>
        </Backdrop>
    )

}

export default memo(ImageDialog);
