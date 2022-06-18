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

const SCALE = 3;
let tapped :boolean = false;
let zoomed = false;
let rect :any = null;
let timer :any = null;
let log :string = ""

const isHorizontalAction = () => {
    if(swipeState.direction === direction.right || swipeState.direction === direction.left){
        return true;
    }

    return false;
}

const ImageDialog = ({mediaUrl,onClose,mediaId}:{mediaUrl:string,onClose:() => void,mediaId:string}) => {

    const ref = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const dref = useRef<HTMLDivElement>(null);

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
        console.log("start")
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

        log += "clean up, "

        if(ref.current){
            ref.current.style.transform = `translate(${0}px, ${0}px)`
        }

    },[ref, closeDialog,cleanupSwipe]);


    const onTouchMove = useCallback((e) => {

        log += "moved, "

        e.preventDefault();

        if(!swipeState.swiping) return;

        const xDiff = swipeState.startX - e.touches[0].clientX;
        const yDiff = swipeState.startY - e.touches[0].clientY;

        console.log(yDiff)
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

    const onImageTap = useCallback((e:MouseEvent) => {

        log += "enter,"
        write();

        if(!tapped) {

            tapped = true;

            log += "single tap,"
            write();

            timer = setTimeout(() => {
                tapped = false;
                log += "time out,"
                write();
            }, 1000 );

            return;
        }

        log += "double,"
        write();
        clearTimeout(timer)
        tapped = false;

        changeScale(e)

    },[])

    const write = () =>{
        if(dref.current) dref.current.innerHTML = log
    }

    const changeScale = (e:MouseEvent) => {

        if(!imageRef.current) return;

        if(zoomed){
            imageRef.current.style["transform"] = "scale(1)"
            zoomed = false
        }else{

            let x = e.pageX - rect.left;
            let y = e.pageY - rect.top;

            const nextTop = rect.top - y * 2
            const nextBottom = (rect.top + rect.height * SCALE) - y * 2

            if(nextTop > 0){
                y = rect.top / 2;
            }else if(nextBottom < window.screen.height){
                y = rect.height - rect.top / 2
            }

            imageRef.current.style["transform-origin" as any] = `${x}px ${y}px`
            imageRef.current.style["transform"] = `scale(${SCALE})`
            zoomed = true;

        }

    }

    const handleKeydown = useCallback((e:KeyboardEvent) => {

        if(e.key === "Escape"){
            closeDialog();
        }

    },[closeDialog]);

    useEffect(() => {
        log += "useeffect, "
        document.body.style.overflow = "hidden";

        window.addEventListener("touchstart", onTouchStart);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);
        document.addEventListener("keydown", handleKeydown, { passive: false });
        imageRef.current?.addEventListener("click", onImageTap, { passive: false });
        rect = imageRef.current?.getBoundingClientRect();

        return (() => {
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
            document.removeEventListener("keydown", handleKeydown);
        });

    }, [onTouchStart,onTouchMove,onTouchEnd,handleKeydown, onImageTap]);

    useEffect( () => () =>  {document.body.style.overflow = ""}, [] );

    const ImageViewer = styled("img")({
        maxHeight: "100%",
        maxWidth: "100%",
        transition: "transform 0.7s",
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
            <div ref={dref} style={{position:"fixed", top:"0px", left:"0px",color:"#fff",zIndex:9999}}></div>
            <Contaner ref={ref}>
                <ImageViewer ref={imageRef} alt={mediaId} src={mediaUrl}/>
            </Contaner>
        </Backdrop>
    )

}

export default memo(ImageDialog);
