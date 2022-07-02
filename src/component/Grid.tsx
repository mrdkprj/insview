import { FixedSizeGrid } from "react-window";
import { styled } from "@mui/system";
import { memo, createRef, useEffect } from "react";
import {IMedia} from "../response";

export interface IGridContext{
    data: IMedia[],
    height: number,
    width: number,
    onImageClick: (index:number) => void,
    onLastItemRenrered: () => void,
    onIdle: (scrollTop : number) => void,
}

let gridScrollTop : number = 0;
let prevScrolllTop : number = 0;
let rowCount : number = 0;
let context :IGridContext;

const columnCount : number = 3;
const barHeight = 45;
const gridRef :React.RefObject<FixedSizeGrid> = createRef();

const Container = styled("div")({
    display:"flex",
    justifyContent: "center",
    alignItems:"center",
    flex: 1,
    marginTop: barHeight,
    overflowY: "auto",
    overflowX:"hidden"
});

const Image = styled("img")({
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: "100%",
    objectFit: "cover"
});

const onGridScroll = ({scrollTop}: {scrollTop: number}) => {
    gridScrollTop = scrollTop;
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

const renderRow = ({ columnIndex, data, rowIndex, style } : { columnIndex:number, data:any, rowIndex:number, style:any }) => {

    const index = columnIndex + rowIndex * 3;

    return (
        <div style={style}>
            {data[index]
                ? <Image alt={data[index].id} src={data[index].media_url} onClick={() => context.onImageClick(index)}/>
                : <div></div>
            }
        </div>
    )
}

export const scrollTo = (scrollTop:number) => {
    gridRef.current?.scrollTo({scrollLeft:0 , scrollTop:scrollTop})
}

export const Grid = memo<IGridContext>( (propContext) => {

    useEffect(() => {
        const id = setInterval(checkScrollTop, 10000);
        return () => clearInterval(id)
    },[])

    context = propContext;
    const imageSize = context.width / 3;

    rowCount = Math.ceil((context.data.length  / columnCount));

    return(
        <Container >
            <FixedSizeGrid
                ref={gridRef}
                columnCount={columnCount}
                columnWidth={imageSize}
                height={context.height}
                rowCount={rowCount}
                rowHeight={imageSize}
                width={context.width}
                itemData={context.data}
                overscanRowCount={0}
                onScroll={onGridScroll}
                onItemsRendered={onItemsRendered}
            >
                {renderRow}
            </FixedSizeGrid>
        </Container>
    )
})
