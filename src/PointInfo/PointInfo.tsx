import * as React from 'react';
import { memo } from 'react';
import { Point } from '../App';
import { PointDetailsSection } from './PointDetailsSection';
import { expandChar, minimizeChar } from '../constants';

import './PointInfo.scss';

interface PointsInfoProps {
  point: Point;
  onDeselect: () => void;
}

export const PointInfo = memo((props: PointsInfoProps) => {
  const { point, onDeselect } = props;
  const [showMoreInfo, setShowMoreInfo] = React.useState(false);

  return (
    <div className="point-info" key={point.id}>
      <div className="point-header">
        <a
          href={`https://www.reddit.com/r/${point.subreddit}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>{point.subreddit}</strong>
        </a>
        <div className="action-buttons">
          <button
            type="button"
            className="toggle-info-button"
            onClick={() => setShowMoreInfo(!showMoreInfo)}
          >
            {showMoreInfo ? minimizeChar : expandChar}
          </button>
          <button
            type="button"
            className="deselect-button"
            onClick={() => onDeselect()}
          >
            x
          </button>
        </div>
      </div>
      {showMoreInfo && <PointDetailsSection point={point} />}
    </div>
  );
});

PointInfo.displayName = 'PointInfo';
