// Based on: https://medium.com/@leofabrikant/react-autocomplete-with-react-virtualized-to-handle-massive-search-results-7865a8786972
import * as React from 'react';
import { areEqual, FixedSizeList as List } from 'react-window';
import './DataList.scss';
import { memo, useRef } from 'react';

export interface DataListProps {
  values: string[];
  id: string;
  onSelect?: (
    selected: string,
    isMultiSelect?: boolean
  ) => void;
  onChange?: (
    newText: string
  ) => void;
}

export const cleanTerm = (term: string) => term.toLowerCase().replace(/\s+/g, '');

const itemHeight = 30;

export const DataList = memo((props: DataListProps) => {
  const {
    values, id, onChange, onSelect,
  } = props;

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [lastHoverIndex, setLastHoverIndex] = React.useState(0);
  const [showMenu, setShowMenu] = React.useState(false);
  const [mouseSelect, setMouseSelect] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleClick = (e: MouseEvent) => {
    if (containerRef?.current?.contains(e.target as Node)) {
      // inside click
      return;
    }
    setShowMenu(false);
    setActiveIndex(null);
  };

  // https://medium.com/@pitipatdop/little-neat-trick-to-capture-click-outside-with-react-hook-ba77c37c7e82
  React.useEffect(() => {
    // add when mounted
    document.addEventListener('mousedown', handleClick);

    // return function to be called when unmounted
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef?.current?.setAttribute('tabIndex', '0');
    }
  }, [containerRef]);

  // @ts-ignore
  // eslint-disable-next-line react/prop-types
  const Row = memo(({ data, index, style }) => {
    // Data passed to List as "itemData" is available as props.data
    const item = data[index];

    return (
      // eslint-disable-next-line max-len
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/mouse-events-have-key-events,jsx-a11y/no-static-element-interactions
      <div
        className="data-list-item"
        onMouseOver={() => {
          if (lastHoverIndex !== index && mouseSelect) {
            setActiveIndex(index);
            setLastHoverIndex(index);
          }
        }}
        onMouseMove={() => setMouseSelect(true)}
        style={{
          ...style,
          backgroundColor: index === activeIndex ? '#0b195e' : '#111111',
          verticalAlign: 'center',
        }}
        onClick={(e) => {
          setShowMenu(false);
          setActiveIndex(null);
          onSelect && onSelect(values[index], e.ctrlKey);
        }}
      >
        {item}
      </div>
    );
  }, areEqual);

  React.useEffect(() => {
    if (activeIndex !== null) {
      listRef.current?.scrollToItem(activeIndex);
    }
  });

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="data-list"
      onKeyDown={(e) => {
        const listLength = values.length;
        // e.preventDefault();
        e.stopPropagation();
        if (e.keyCode === 13) { // enter
          if (activeIndex) {
            const value = values[activeIndex];
            onSelect && value && onSelect(value, e.ctrlKey);
            setShowMenu(false);
            setActiveIndex(null);
          } else {
            onSelect && onSelect(searchTerm, e.ctrlKey);
          }
        } else {
          if (!showMenu) {
            setShowMenu(true);
          }
          if (e.keyCode === 38) { // up arrow
            if (activeIndex === null) {
              setActiveIndex(listLength - 1);
            } else {
              setMouseSelect(false);
              const newActiveIndex = activeIndex - 1;
              setActiveIndex(newActiveIndex >= 0 ? newActiveIndex : listLength - 1);
            }
          } else if (e.keyCode === 40) { // down arrow
            if (activeIndex === null) {
              setActiveIndex(0);
            } else {
              setMouseSelect(false);
              const newActiveIndex = activeIndex + 1;
              setActiveIndex(newActiveIndex < listLength ? newActiveIndex : 0);
            }
          } else if (e.keyCode === 33) { // page up
            if (activeIndex === null) {
              setActiveIndex(0);
            } else {
              setMouseSelect(false);
              const newActiveIndex = activeIndex - 6;
              setActiveIndex(newActiveIndex >= 0 ? newActiveIndex : 0);
            }
          } else if (e.keyCode === 34) { // page down
            if (activeIndex === null) {
              setActiveIndex(listLength - 1);
            } else {
              setMouseSelect(false);
              const newActiveIndex = activeIndex + 6;
              setActiveIndex(newActiveIndex < listLength ? newActiveIndex : listLength - 1);
            }
          } else if (e.keyCode === 27) { // escape
            setActiveIndex(null);
            setShowMenu(false);
          } else {
            setActiveIndex(null);
          }
        }
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div className="data-list-input" ref={containerRef}>
        <input
          type="text"
          id={id}
          list="subreddits"
          onClick={() => setShowMenu(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (onChange) {
              onChange(e.target.value);
            }
          }}
        />
        {showMenu
        && (
          <List
            ref={listRef}
            width="100%"
            height={190}
            key={id}
            style={{ position: 'absolute' }}
            itemCount={values.length}
            itemData={values}
            itemSize={itemHeight}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
});

DataList.displayName = 'DataList';
