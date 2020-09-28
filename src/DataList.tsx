//Based on: https://medium.com/@leofabrikant/react-autocomplete-with-react-virtualized-to-handle-massive-search-results-7865a8786972
import * as React from "react";
import {CSSProperties, memo, ReactNode} from "react";
import Autocomplete from "react-autocomplete";
import {List, ListRowRenderer} from "react-virtualized";
import {findDOMNode} from "react-dom";

export interface DataListProps {
  values: string[];
  onSelect: (
    selected: string
  ) => void;
  onChange?: (
    selected: string
  ) => void;
}

const itemHeight = 30;

const Item = (item:string, highlighted: boolean) => {
  return <div   style={{
                //height: itemHeight,
                boxSizing: "border-box",
                background: highlighted ? "#0b195e" : "#111111",
              }}>
            {item}
        </div>;
};

export const cleanTerm = (term: string) =>
  term.toLowerCase().replace(/\s+/g, '')


  const menuRenderer =  (items: ReactNode[], value: string, autocompleteStyle: CSSProperties) => {
    const rowRenderer: ListRowRenderer = ({ key, index, style }) => {
      const Item = items[index] as React.ReactElement;
      const onMouseClick = (e: MouseEvent) => {
        if (Item) {
          e.preventDefault();
          e.stopPropagation();
          Item.props.onClick(e);
        }
      };

      const onMouseDown = (e: MouseEvent) => {
          e.preventDefault();
      };

      return value && (
          React.cloneElement(Item, {
            key: key,
            style: {
              ...Item.props.style,
              ...style
            },
            className: "virtual-list-item",
            onMouseEnter: null,
            onMouseDown: onMouseDown,
            onClick: onMouseClick
          })
      );
    };

    return (
      <List
        rowHeight={itemHeight}
        height={207}
        //ref={}
        rowCount={items.length}
        rowRenderer={rowRenderer}
        width={autocompleteStyle.minWidth as number || 0}
        style={{
          display: items.length ? "block" : "none",
          maxHeight: "207px",
          overflowY: "scroll",
        }}
      />
    );
  };


// Disable Auto Scrolling as it breaks with virtualized lists
class LimitedAutocomplete extends Autocomplete {
  constructor(props: Autocomplete.Props) {
    super(props);
    // @ts-ignore
    this.maybeScrollItemIntoView = () => {
      // @ts-ignore
      if (this.isOpen() && this.state.highlightedIndex !== null) {
        const itemNode = findDOMNode(this.refs['item-' + this.state.highlightedIndex]) as Element;
        if (itemNode) {
          itemNode.scrollIntoView(false);
        }
      }
      ;
    }
  }
}

export const DataList = memo((props: DataListProps) => {
  const {values, onSelect, onChange} = props;

  const [searchTerm, setSearchTerm] = React.useState("");

  const cleanedSearchTerm = cleanTerm(searchTerm);
   const data =  searchTerm
     ? values.filter((value) =>
       value.toLowerCase().includes(cleanedSearchTerm)
     )
     : [] ;

  //const Menu = createMenuRenderer();

  return (
      <LimitedAutocomplete
        renderItem={Item}
        items={data}
        getItemValue={(item) => item}
        value={searchTerm}
        onChange={(event) => {onChange !== undefined && onChange(cleanTerm(event.target.value)); setSearchTerm(event.target.value);}}
        onSelect={(value) => { onSelect(cleanTerm(value));}}
        renderMenu={menuRenderer}
      />
  );
})

