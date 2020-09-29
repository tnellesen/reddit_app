//Based on: https://medium.com/@leofabrikant/react-autocomplete-with-react-virtualized-to-handle-massive-search-results-7865a8786972
import * as React from "react";
import {areEqual, FixedSizeList as List} from "react-window";
import "./DataList.scss";
import {memo, useRef} from "react";

export interface DataListProps {
  values: string[];
  id: string;
  onSelect?: (
    selected: string
  ) => void;
  onChange?: (
    selected: string
  ) => void;
}

export const cleanTerm = (term: string) =>
  term.toLowerCase().replace(/\s+/g, '')



export const DataList2 = memo((props: DataListProps) => {
  const {values, id, onChange, onSelect} = props;

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lastHoverIndex, setLastHoverIndex] = React.useState(0);
  const [showMenu, setShowMenu] = React.useState(false);
  const [mouseSelect, setMouseSelect] = React.useState(false);

  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (containerRef) {
      containerRef?.current?.setAttribute('tabIndex', '0');
    }
  }, [containerRef.current]);

  // @ts-ignore
  const Row = memo(({ data, index, style }) => {
    // Data passed to List as "itemData" is available as props.data
    const item = data[index];

    return (
      <div onMouseOver={() => {
        if(lastHoverIndex !== index && mouseSelect) {
          setActiveIndex(index);
          setLastHoverIndex(index);
        }
      }}
           onMouseMove={() => setMouseSelect(true)}
           style={{...style, backgroundColor: index === activeIndex ?  "#0b195e" : "#111111"}}
            onClick={() => {
              setShowMenu(false) ;
              onSelect && onSelect(values[index]);}}>
        {item}
      </div>
    );
    // @ts-ignore
  }, areEqual)


  return (
    <div className="data-list">
      <span className="data-list-input">
        <input
          type="text"
          id={id}
          list="subreddits"
          onChange={(e) => {onChange && onChange(e.target.value)}}
          onClick={() => setShowMenu(true)}
          onKeyDown={(e) =>  {
            if (e.keyCode === 13) {
              setShowMenu(false) ;
              onSelect && onSelect(values[activeIndex]);
            }
            else if (e.keyCode === 38) {
              if (activeIndex === 0) {
                return;
              }
              setMouseSelect(false);
              const newActiveIndex = activeIndex - 1;
              setActiveIndex(newActiveIndex);
              listRef.current?.scrollToItem(newActiveIndex)
            } else if (e.keyCode === 40) {
              if(!showMenu) {
                setShowMenu(true);
                return;
              }
              if (activeIndex === values.length - 1) {
                return;
              }
              setMouseSelect(false);
              const newActiveIndex = activeIndex + 1;
              setActiveIndex(newActiveIndex);
              listRef.current?.scrollToItem(newActiveIndex)
            }
          }}
          onBlur={(e) => {
            if(e.relatedTarget !== containerRef.current)
            setShowMenu(false)
          }}
        />
    </span>
      {showMenu &&
        <List
            ref={listRef}
            outerRef={containerRef}
            width={"100%"}
            height={220}
            key={id}
            itemCount={values.length}
            itemData={values}
            itemSize={40}
        >
          {Row}
        </List>
      }
     </div>
  );
})

