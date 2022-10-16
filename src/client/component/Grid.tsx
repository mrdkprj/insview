import { FixedSizeGrid } from "react-window";
import { css } from "@emotion/react";
import {RefObject, memo, createRef, useEffect, Fragment, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import {IMedia, IUser} from "@shared";
import ImageDialog from "./ImageDialog";

type GridProps = {
    data: IMedia[],
    height: number,
    width: number,
    margin:number,
    initialScrollTop?: number,
    onLastItemRenrered?: () => void,
    onIdle?: (scrollTop : number) => void,
    onUserTagClick?: (user:IUser) => void,
}

export interface GridHandler {
    scrollTo: (scrollTop:number) => void,
}

const Grid = forwardRef<GridHandler, GridProps>((props, ref) => {

    const columnCount = 3;
    const imageSize = props.width / 3;
    const rowCount = Math.ceil((props.data.length  / columnCount));

    const gridRef :RefObject<FixedSizeGrid> = createRef();
    const gridScrollTop = useRef(0);
    const prevScrolllTop = useRef(0);
    const startIndex = useRef(0);
    const [_open, _setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        scrollTo: (scrollTop:number) => {
            gridRef.current?.scrollTo({scrollLeft:0 , scrollTop:scrollTop})
        }
    }));

    const onImageClose = () => {
        _setOpen(false);
    }

    const onImageClick = (index:number) => {
        startIndex.current = index;
        _setOpen(true);
    }

    const onImageRendered = (index:number) => {
        gridRef.current?.scrollToItem({rowIndex:Math.floor(index / 3)})
    }

    const onImageTagClick = (user:IUser) => {
        props.onUserTagClick && props.onUserTagClick(user)
    }

    const onGridScroll = ({scrollTop}: {scrollTop: number}) => {
        gridScrollTop.current = scrollTop;
    }

    const onItemsRendered = ({visibleRowStopIndex}:{visibleRowStopIndex:number}) => {
        if(visibleRowStopIndex === rowCount - 1){
            props.onLastItemRenrered && props.onLastItemRenrered()
        }
    }

    const checkScrollTop = useCallback(() => {

        if(rowCount <= 0) return;

        if(gridScrollTop.current === prevScrolllTop.current){
            props.onIdle && props.onIdle(gridScrollTop.current)
        }else{
            prevScrolllTop.current = gridScrollTop.current;
        }

    },[props, rowCount])

    const renderRow = ({ columnIndex, data, rowIndex, style } : { columnIndex:number, data:IMedia[], rowIndex:number, style:React.CSSProperties }) => {

        const index = columnIndex + rowIndex * 3;

        return (
            <div style={style}>
                {data[index]
                    ? <img css={Image} alt={data[index].id} src={data[index].media_url} onClick={() => onImageClick(index)}/>
                    : <div></div>
                }
            </div>
        )
    }

    useEffect(() => {
        const id = setInterval(checkScrollTop, 10000);
        return () => clearInterval(id)
    },[checkScrollTop])

    const Container = css({
        display:"flex",
        justifyContent: "center",
        alignItems:"center",
        flex: 1,
        marginTop: `${props.margin}px`,
        overflowY: "auto",
        overflowX:"hidden"
    });

    const Image = css({
        height: "100%",
        left: 0,
        position: "absolute",
        top: 0,
        width: "100%",
        objectFit: "cover"
    });

    return(
        <Fragment>
            {_open && <ImageDialog width={props.width} height={props.height} onClose={onImageClose} data={props.data} startIndex={startIndex.current} onImageRendered={onImageRendered} onUserTagClick={onImageTagClick}/> }
            <div css={Container}>
                <FixedSizeGrid
                    ref={gridRef}
                    columnCount={columnCount}
                    columnWidth={imageSize}
                    height={props.height - props.margin}
                    rowCount={rowCount}
                    rowHeight={imageSize}
                    width={props.width}
                    itemData={props.data}
                    overscanRowCount={0}
                    onScroll={onGridScroll}
                    onItemsRendered={onItemsRendered}
                >
                    {renderRow}
                </FixedSizeGrid>
            </div>
        </Fragment>
    )

});

export default memo(Grid);