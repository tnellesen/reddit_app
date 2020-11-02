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

const itemHeight = 30;

export const DataList = memo((props: DataListProps) => {
  const {values, id, onChange, onSelect} = props;

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [lastHoverIndex, setLastHoverIndex] = React.useState(0);
  const [showMenu, setShowMenu] = React.useState(false);
  const [mouseSelect, setMouseSelect] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef?.current?.setAttribute('tabIndex', '0');
    }
  }, [containerRef]);

  // @ts-ignore
  const Row = memo(({ data, index, style }) => {
    // Data passed to List as "itemData" is available as props.data
    const item = data[index];

    return (
      <div className="data-list-item"
        onMouseOver={() => {
        if(lastHoverIndex !== index && mouseSelect) {
          setActiveIndex(index);
          setLastHoverIndex(index);
        }
      }}
           onMouseMove={() => setMouseSelect(true)}
           style={{
             ...style,
             backgroundColor: index === activeIndex ?  "#0b195e" : "#111111",
             verticalAlign: "center"
           }}
            onClick={() => {
              setShowMenu(false) ;
              setActiveIndex(null);
              onSelect && onSelect(values[index]);}}>
        {item}
      </div>
    );
  }, areEqual)

  React.useEffect(() => {
    if(activeIndex !== null) {
      listRef.current?.scrollToItem(activeIndex);
    }
  });

  return (
    <div
      className="data-list"
      onBlur={(e) => {
        if(e.relatedTarget && e.relatedTarget !== containerRef.current) {
          setShowMenu(false);
          setActiveIndex(null);
        }
      }}
      onKeyDown={(e) =>  {
        const listLength = values.length;
        //e.preventDefault();
        e.stopPropagation();
        if (e.keyCode === 13) {
          if(activeIndex) {
            const value = values[activeIndex];
            onSelect && value && onSelect(value);
            setShowMenu(false);
            setActiveIndex(null);
          }
          else {
            onSelect && onSelect(searchTerm);
          }
        }
        else {
          if(!showMenu) {
            setShowMenu(true);
          }
          if (e.keyCode === 38) {
            if(activeIndex === null) {
              setActiveIndex(listLength - 1);
            }
            else {
              setMouseSelect(false);
              const newActiveIndex = activeIndex - 1;
              setActiveIndex(newActiveIndex >= 0 ? newActiveIndex : listLength - 1);
            }
          } else if (e.keyCode === 40) {
            if(activeIndex === null) {
              setActiveIndex(0);
            }
            else {
              setMouseSelect(false);
              const newActiveIndex = activeIndex + 1;
              setActiveIndex(newActiveIndex < listLength ? newActiveIndex : 0);
            }
          }
          else {
            setActiveIndex(null);
          }
        }
      }}>
      <div className="data-list-input" onClick={() => setShowMenu(true)}>
        <input
          type="text"
          id={id}
          list="subreddits"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if(onChange) {
              onChange(e.target.value);
            }
          }}
        />
    </div>
      {showMenu &&
        <List
            ref={listRef}
            outerRef={containerRef}
            width={"100%"}
            height={250}
            key={id}
            style={{position: "absolute"}}
            itemCount={values.length}
            itemData={values}
            itemSize={itemHeight}
        >
          {Row}
        </List>
      }
     </div>
  );
})

