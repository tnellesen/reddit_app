import * as React from "react";
import {Point} from "../App";
import {memo} from "react";

import "./PointInfo.scss";
import {expandChar, minimizeChar} from "../constants";

interface PointsInfoProps {
  point: Point;
}

export const PointInfo = memo((props: PointsInfoProps) => {
  const { point } = props;
  const [showMoreInfo, setShowMoreInfo] = React.useState(false);

  const extraPointInfo =
    <>
      <p>% NSFW: {point.percentNsfw}</p>
      <p>X: {point.x}</p>
      <p>Y: {point.y}</p>
      <p>Z: {point.z}</p>
    </>;

  return (
    <div className="point-info" key={point.id}>
      <div className="point-header">
        <a
          href={`https://www.reddit.com/r/${point.subreddit}`}
          target="_blank"
          rel="noopener noreferrer">
          <strong>{point.subreddit}</strong>
        </a>
        <button
          className="toggle-info-button"
          onClick={() => setShowMoreInfo(!showMoreInfo)}>
          {showMoreInfo ? minimizeChar : expandChar}
        </button>
      </div>
      {showMoreInfo &&
        extraPointInfo
      }
    </div>
  );
});
