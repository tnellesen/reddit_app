import * as React from 'react';
import { memo } from 'react';
import useAxios from 'axios-hooks';
import { Point } from '../App';

interface PointsDetailsSectionProps {
  point: Point;
}

interface PointDetails {
  description: string;
  subscribers: number;
  dateCreated: Date;
}

type NoInfo = 'NO_INFO';

type FetchedPointDetails = PointDetails | NoInfo | undefined;

const loadingMessage = '...';
const noInfoMessage = 'No Info';

function hasInfo(fetchedPointDetails: FetchedPointDetails): fetchedPointDetails is PointDetails {
  return (fetchedPointDetails as PointDetails).description !== undefined;
}

export const PointDetailsSection = memo((props: PointsDetailsSectionProps) => {
  const { point } = props;
  const [pointDetails, setPointDetails] = React.useState<FetchedPointDetails>(undefined);

  const [{ data, loading, error }] = useAxios(
    `https://redditexplorer.com/SubredditInfo/subreddit:${point.subreddit}`,
  );

  React.useEffect(() => {
    if (data) {
      setPointDetails(
        {
          description: data.public_description,
          subscribers: data.subscribers,
          dateCreated: new Date(data.created_utc * 1000),
        },
      );
    } else if (loading) {
      setPointDetails(undefined);
    } else if (error) {
      setPointDetails('NO_INFO');
    }
  }, [data, loading, error]);

  return (
    <>
      <p>
        <h4># Subscribers</h4>
        :&nbsp;
        {pointDetails
          ? hasInfo(pointDetails)
            ? pointDetails.subscribers
            : noInfoMessage
          : loadingMessage}
      </p>
      <p>
        <h4>About</h4>
        :&nbsp;
        {pointDetails
          ? hasInfo(pointDetails)
            ? pointDetails.description
            : noInfoMessage
          : loadingMessage}
      </p>
      <p>
        <h4>Date Created</h4>
        :&nbsp;
        {pointDetails
          ? hasInfo(pointDetails)
            ? pointDetails.dateCreated.toLocaleString()
            : noInfoMessage
          : loadingMessage}
      </p>
      <p>
        <h4>% NSFW</h4>
        :&nbsp;
        {point.percentNsfw}
      </p>
    </>
  );
});

PointDetailsSection.displayName = 'PointDetailsSection';
