import { memo, useEffect,useCallback, useRef } from "react"
import { css } from "@emotion/react";

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

const SCALE = 3;
let tapped :boolean = false;
let zoomed = false;
let timer :any = null;
let imageRect :any = null;

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
            imageRef.current.style["transform"] = "scale(1)"
            zoomed = false
        }else{

            let x = e.pageX - imageRect.left;
            let y = e.pageY - imageRect.top;

            const nextTop = imageRect.top - y * 2
            const nextBottom = (imageRect.top + imageRect.height * SCALE) - y * 2

            if(nextTop > 0){
                y = imageRect.top / 2;
            }else if(nextBottom < window.screen.height){
                y = imageRect.height - imageRect.top / 2
            }

            imageRef.current.style["transform-origin" as any] = `${x}px ${y}px`
            imageRef.current.style["transform"] = `scale(${SCALE})`

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

        imageRect = imageRef.current?.getBoundingClientRect();

        return (() => {
            document.removeEventListener("keydown", handleKeydown);
        });

    }, [onTouchStart,onTouchMove,onTouchEnd,handleKeydown, onImageClick]);

    useEffect( () => () =>  {document.body.style.overflow = ""}, [] );

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
        <div css={Backdrop}>
            <div css={Contaner} ref={ref}>
                <img css={ImageViewer} ref={imageRef} alt={mediaId} src={mediaUrl}/>
            </div>
        </div>
    )

}

export default memo(ImageDialog);
