//Based on: https://medium.com/@leofabrikant/react-autocomplete-with-react-virtualized-to-handle-massive-search-results-7865a8786972
import * as React from "react";
import {List, ListRowRenderer} from "react-virtualized";
import {memo} from "react";

export interface DataListProps {
  values: string[];
  id: string;
}

export const cleanTerm = (term: string) =>
  term.toLowerCase().replace(/\s+/g, '')



export const DataList2 = memo((props: DataListProps) => {
  const {values, id} = props;

  const rowRenderer: ListRowRenderer = ({ key, index, style}) => {
    const item = values[index];
    return <option key={key} style={style} value={item}/>
  };

  return (
    <datalist id={id}>
      <List
        width={300}
        height={999}
        rowCount={values.length}
        rowHeight={20}
        rowRenderer={rowRenderer}
      />,
    </datalist>
  );
})

