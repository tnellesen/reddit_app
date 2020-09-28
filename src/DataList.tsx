//Based on: https://medium.com/@leofabrikant/react-autocomplete-with-react-virtualized-to-handle-massive-search-results-7865a8786972
import * as React from "react";
import {CSSProperties, memo, ReactNode} from "react";
import Autocomplete from "react-autocomplete";
import {List, CellMeasurer, CellMeasurerCache, ListRowRenderer} from "react-virtualized";

export interface DataListProps {
  values: string[];
  onSelect: (
    selected: string | ((prevVar: string) => string)
  ) => void;
  onChange: (
    selected: string | ((prevVar: string) => string)
  ) => void;
}

const Item = (item:string) => {
  return <div>{item}</div>;
};

const createMenuRenderer = (cellHeightCache: CellMeasurerCache) => {
  return (items: ReactNode[], value: string, autocompleteStyle: CSSProperties) => {
    const rowRenderer: ListRowRenderer = ({ key, index, parent, style }) => {
      const Item = items[index];
      return value && (
        <CellMeasurer
          cache={cellHeightCache}
          key={key}
          parent={parent}
          rowIndex={index}
        >
          {React.cloneElement(Item as React.ReactElement, {
            style: {
              ...style,
              height: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              borderBottom: "1px solid grey",
              background: "#222222",
              padding: "5px",
              boxSizing: "border-box"
            },
            key: key,
            onMouseEnter: null,
          })}
        </CellMeasurer>
      );
    };

    return (
      <List
        rowHeight={cellHeightCache.rowHeight}
        height={207}
        rowCount={items.length}
        rowRenderer={rowRenderer}
        width={autocompleteStyle.minWidth as number || 0}
        style={{
          position: "absolute",
          backgroundColor: "white",
          border: "1px solid black",
          height: "auto",
          maxHeight: "207px",
          overflowY: "scroll",
          display: items.length ? "block" : "none"
        }}
      />
    );
  };
}

export const DataList = memo((props: DataListProps) => {
  const {values, onSelect, onChange} = props;

  const [searchTerm, setSearchTerm] = React.useState("");

  const cellHeightCache = new CellMeasurerCache({
    defaultHeight: 42,
    fixedWidth: true
  });

  const cleanedSearchTerm = searchTerm.toLowerCase().replace(/\s+/g, '');;
  const data = searchTerm
    ? values.filter((value) =>
      value.toLowerCase().includes(cleanedSearchTerm)
    )
    : [];

  const Menu = createMenuRenderer(cellHeightCache);

  return (
      <Autocomplete
        renderItem={Item}
        items={data}
        getItemValue={(item) => item}
        value={searchTerm}
        onChange={(_, value) => {onChange(value); setSearchTerm(value);}}
        onSelect={onSelect}
        renderMenu={Menu}
      />
  );
})

