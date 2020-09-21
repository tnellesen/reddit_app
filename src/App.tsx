import * as React from "react";
import { ThreePointVis } from "./ThreePointVis/ThreePointVis";
import "./styles.scss";
//import redditClusters from "../data/redditClusters.json";
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
import {LoadingOverlay} from "./LoadingOverlay/LoadingOverlay";

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

export const pointCounts = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];

export default function App() {
  const [redditData, setRedditData] = React.useState<Point[]>([]);
  const [clusters, setClusters] = React.useState<Cluster[]>([]);
  const [clusterIndex, setClusterIndex] = React.useState<number>(0);
  const [pointCount, setPointCoint] = React.useState<number>(10000);
  const [clusterCounts, setClusterCounts] = React.useState<number[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showControls, setShowControls] = React.useState(true);
  const [pointResolution, setPointResolution] = React.useState(
    Math.max(Math.min(Math.floor(window.innerWidth / 33), 32), 1)
  );
  const [maxPercentNSFW, setMaxPercentNSFW] = React.useState(100);

  const [{ data, loading, error }] = useAxios(
    `https://redditexplorer.com/GetData/dataset:original,n_points:${pointCount}`
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
            cluster: point.cluster[clusterIndex],
            percentNsfw: point.percentNsfw,
            include: point.percentNsfw <= maxPercentNSFW
          };
        })
      : [];

    const newClusterCounts = data ? data.clusterCounts : [];
    const clusterCount = newClusterCounts[clusterIndex];

    const newClusters = data
      ? data.clusters[clusterCount].map(
          (cluster: any): Cluster => {
            return {
              id: cluster.id,
              obj: getMesh(loader.parse(cluster.obj))
            };
          }
        )
      : [];

    if(newData && newData.length) {
      setRedditData(newData);
    }
    if(newClusters && newClusters.length) {
      setClusters(newClusters);
    }
    setClusterCounts(newClusterCounts)
  }, [maxPercentNSFW, data, clusterIndex]);

  React.useEffect(() => {
    const clusterCount = clusterCounts[clusterIndex];

    const newClusters = data && clusterCount
      ? data.clusters[clusterCount].map(
        (cluster: any): Cluster => {
          return {
            id: cluster.id,
            obj: getMesh(loader.parse(cluster.obj))
          };
        }
      )
      : [];
    setClusters(newClusters);
  }, [clusterIndex, clusterCounts, data]);

  const search = () => {
    redditData.forEach((point) => {
      if (point.subreddit.toLowerCase() === searchTerm.toLowerCase()) {
        setSelectedId(point.id);
      }
    });
  };

  return (
    <div className="App">
      {loading && <LoadingOverlay message={"Loading dollops of dope data"}/>}
      {error && <span className={"error-message"}>{error.message}</span>}
      {!loading && !error && redditData && redditData.length && (
        <ViewportProvider key={redditData.length}>
          <div className="vis-container">
              <ThreePointVis
                data={redditData}
                clusters={clusters}
                selectedId={selectedId}
                onSelect={setSelectedId}
                pointResolution={pointResolution}
                voxelResolution={Math.max(6, Math.floor(Math.cbrt(redditData.length/80)))}
              />
            )
          </div>
        </ViewportProvider>)
      }
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
            {!loading && data && selectedId !== null && (
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
              <div>
                <label htmlFor="numClusters" ># Clusters: </label>
                <select name="numClusters" id="numClusters" onChange={(event) => setClusterIndex(clusterCounts.indexOf(+event.target.value))}>
                  {clusterCounts.map(clusterCount => <option value={clusterCount} key={clusterCount}>{clusterCount}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pointCount" ># Points: </label>
                <select name="pointCount" id="pointCount" onChange={(event) => {
                  setPointCoint(+event.target.value);
                  setSelectedId(null);
                }}>
                  {pointCounts.map(pointCount => <option value={pointCount} key = {pointCount}>{pointCount}</option>)}
                </select>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
