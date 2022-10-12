import { FixedSizeGrid } from "react-window";
import { css } from "@emotion/react";
import {RefObject, memo, createRef, useEffect, Fragment, useState } from "react";
import {IMedia, IUser} from "@shared";
import ImageDialog from "./ImageDialog";

type GridProps = {
    data: IMedia[],
    height: number,
    width: number,
    margin:number,
    initialScrollTop?: number,
    onImageClick: (index:number) => void,
    onLastItemRenrered: () => void,
    onIdle: (scrollTop : number) => void,
    onUserTagClick: (user:IUser) => void,
}

let gridScrollTop = 0;
let prevScrolllTop = 0;
let rowCount = 0;
let startIndex = 0;
let context :GridProps;

const columnCount = 3;
const barHeight = 45;
const gridRef :RefObject<FixedSizeGrid> = createRef();

const onGridScroll = ({scrollTop}: {scrollTop: number}) => {
    gridScrollTop = scrollTop;
}

export const scrollTo = (scrollTop:number) => {
    gridRef.current?.scrollTo({scrollLeft:0 , scrollTop:scrollTop})
}

const onItemsRendered = ({visibleRowStopIndex}:{visibleRowStopIndex:number}) => {
    if(visibleRowStopIndex === rowCount - 1){
        context.onLastItemRenrered()
    }
}

const checkScrollTop = () => {

    if(rowCount <= 0) return;

    if(gridScrollTop === prevScrolllTop){
        context.onIdle(gridScrollTop)
    }else{
        prevScrolllTop = gridScrollTop;
    }

}

export const Grid = memo<GridProps>( (props) => {

    const [_open, _setOpen] = useState(false);

    context = props;

    const onImageClose = () => {
        _setOpen(false);
    }

    const onImageClick = (index:number) => {
        startIndex = index;
        _setOpen(true);
    }

    const onImageRendered = (index:number) => {
        gridRef.current?.scrollToItem({rowIndex:Math.floor(index / 3)})
    }

    const onImageTagClick = (user:IUser) => {
        _setOpen(false);
        props.onUserTagClick(user)
    }

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
    },[])

    const imageSize = props.width / 3;

    rowCount = Math.ceil((props.data.length  / columnCount));

    return(
        <Fragment>
            {_open && <ImageDialog width={props.width} height={props.height} onClose={onImageClose} data={props.data} startIndex={startIndex} onImageRendered={onImageRendered} onUserTagClick={onImageTagClick}/> }
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

})

const Container = css({
    display:"flex",
    justifyContent: "center",
    alignItems:"center",
    flex: 1,
    marginTop: barHeight,
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

