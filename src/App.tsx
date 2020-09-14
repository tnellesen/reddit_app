import * as React from "react";
import { ThreePointVis } from "./ThreePointVis/ThreePointVis";
import "./styles.scss";
import redditClusters from "../data/redditClusters.json";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import {
  Group,
  Mesh,
  Object3D,
  BoxBufferGeometry,
  MeshBasicMaterial
} from "three";
import { ViewportProvider } from "./ViewportHooks";
import useAxios from "axios-hooks";

export interface Point {
  id: number;
  subreddit: string;
  x: number;
  y: number;
  z: number;
  cluster: number;
  percentNsfw: number;
  include: boolean;
}

export interface Cluster {
  id: number;
  obj: Mesh;
}

const loader = new OBJLoader();

const getMesh = (group: Group | Object3D): Mesh => {
  for (let i = 0; i < group.children.length; i++) {
    const child = group.children[i];
    if (child instanceof Mesh) {
      return child;
    }
    if (child.children.length) {
      return getMesh(child);
    }
  }
  // return error mesh
  var geometry = new BoxBufferGeometry(1, 1, 1);
  var material = new MeshBasicMaterial({ color: 0xffff00 });
  return new Mesh(geometry, material);
};

export default function App() {
  const [redditData, setRedditData] = React.useState<Point[]>([]);
  const [clusters, setClusters] = React.useState<Cluster[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showControls, setShowControls] = React.useState(true);
  const [pointResolution, setPointResolution] = React.useState(
    Math.max(Math.min(Math.floor(window.innerWidth / 33), 32), 1)
  );
  const [maxPercentNSFW, setMaxPercentNSFW] = React.useState(100);

  const [{ data, loading, error }, refetch] = useAxios(
    `https://redditexplorer.com/GetData/start:1,stop:50000,dim:3,n_clusters:10,method:kmeans,cluster_hulls:yes`
  );

  //const data = redditClusters ;

  React.useEffect(() => {
    const newData = data
      ? data.data.map((point: any, index: number) => {
          return {
            id: index,
            subreddit: point.subreddit,
            x: point.x,
            y: point.y,
            z: point.z,
            cluster: point.cluster,
            percentNsfw: point.percentNsfw,
            include: point.percentNsfw <= maxPercentNSFW
          };
        })
      : [];

    const newClusters = data
      ? data.clusters.map(
          (cluster: any): Cluster => {
            return {
              id: cluster.id,
              obj: getMesh(loader.parse(cluster.obj))
            };
          }
        )
      : [];
    setRedditData(newData);
    setClusters(newClusters);
  }, [maxPercentNSFW, data]);

  const search = () => {
    redditData.forEach((point) => {
      if (point.subreddit.toLowerCase() === searchTerm.toLowerCase()) {
        setSelectedId(point.id);
      }
    });
  };

  const hasData = redditData && Object.keys(redditData).length > 0;

  return (
    <div className="App">
      <ViewportProvider>
        <div className="vis-container">
          {hasData && (
            <ThreePointVis
              data={redditData}
              clusters={clusters}
              selectedId={selectedId}
              onSelect={setSelectedId}
              pointResolution={pointResolution}
            />
          )}
        </div>
      </ViewportProvider>
      <div className="controls">
        <div className="controls-title-bar">
          <h3 className="title">Reddit Explorer</h3>
          <button
            className="minimize-controls-button"
            onClick={() => setShowControls(!showControls)}
          >
            {showControls ? "-" : "+"}
          </button>
        </div>
        {showControls && (
          <>
            {hasData && selectedId !== null && (
              <div className="selected-point">
                You selected{" "}
                <a
                  href={`https://www.reddit.com/r/${redditData[selectedId].subreddit}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>{redditData[selectedId].subreddit}</strong>
                </a>
                <p>X: {redditData[selectedId].x}</p>
                <p>Y: {redditData[selectedId].y}</p>
                <p>Z: {redditData[selectedId].z}</p>
                <p>% NSFW: {redditData[selectedId].percentNsfw}</p>
              </div>
            )}
            <form
              onSubmit={(event) => {
                search();
                event.preventDefault();
              }}
            >
              <input
                type="text"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <button>Search</button>
              <div>
                <label htmlFor="resolutionSlider">
                  {" "}
                  Point Resolution: {pointResolution}
                </label>
                <input
                  id="resolutionSlider"
                  type="range"
                  min="1"
                  max="32"
                  value={pointResolution}
                  onChange={(event) => setPointResolution(+event.target.value)}
                  step="1"
                />
                <br />
                <label htmlFor="nsfwSlider">
                  {" "}
                  Max % NSFW: {maxPercentNSFW}
                </label>
                <input
                  id="nsfwSlider"
                  type="range"
                  min={0}
                  max={100}
                  step={0.01}
                  value={maxPercentNSFW}
                  onChange={(event) => setMaxPercentNSFW(+event.target.value)}
                />
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
