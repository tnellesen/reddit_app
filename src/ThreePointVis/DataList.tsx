//reference: https://codesandbox.io/s/react-three-fiber-hud-water-fxaa-42ocf?file=/src/index.js:279-1471
import * as React from "react";
import {memo} from "react";

export interface DataListProps {
  values: string[];
  id: string;
}

const batchSize = 100;

export const  DataList = memo((props: DataListProps) => {
  const {values, id} = props;
  const [renderedItems, setRenderedItems] = React.useState(values.slice(0, batchSize));

  setTimeout(() => {
    if (renderedItems.length < values.length) {
      setRenderedItems(values.slice(0, renderedItems.length + batchSize))
    }
  }, 0);

  return (
    <datalist id={id}>
      {values.map(name => <option key={name} value={name}/>)}
    </datalist>
  )
})
