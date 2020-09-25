import * as React from "react";
import { ThreePointVis } from "./ThreePointVis/ThreePointVis";
import "./styles.scss";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import {
  Group,
  Mesh,
  Object3D,
  BoxBufferGeometry,
  MeshBasicMaterial, Sphere, Vector3
} from "three";
import {useWindowSize} from "./ViewportHooks";
import useAxios from "axios-hooks";
import {LoadingOverlay} from "./LoadingOverlay/LoadingOverlay";
import {CLIP_SCALE_FACTOR, dataSetList, dataSets, MAX_POINT_RES, MIN_VOXEL_RES, POINT_RADIUS, MAX_VOXEL_RES} from "./constants";
import {Stats} from "./ThreePointVis/Stats";
import {Canvas} from "react-three-fiber";
import {Effects} from "./ThreePointVis/Effects";
import * as THREE from "three";
import {CollisionSphere} from "./CollisionSphere";
import {useMemo} from "react";

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

const getAutoVoxelResolution = (numberOfPoints: number) => {
  return Math.max(MIN_VOXEL_RES,
    Math.min(MAX_VOXEL_RES,
      Math.floor(Math.cbrt(numberOfPoints/80))))
}

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
    Math.max(Math.min(Math.floor(window.innerWidth / 69), MAX_POINT_RES), 1)
  );
  const [maxPercentNSFW, setMaxPercentNSFW] = React.useState(100);
  const [usePostProcessing, setUsePostProcessing] = React.useState(true);
  const [showClusterHulls, setShowClusterHulls] = React.useState(false);
  const [dataSet, setDataSet] = React.useState<string>(dataSets[Object.keys(dataSets)[0]]);
  const [camera, setCamera] = React.useState();
  const [voxelResolution, setVoxelResolution] = React.useState(getAutoVoxelResolution(pointCount));
  const [debugVoxels, setDebugVoxels] = React.useState(false);

  const [{ data, loading, error }] = useAxios(
    `https://redditexplorer.com/GetData/dataset:${dataSet},n_points:${pointCount}`
  );

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
    setClusterCounts(newClusterCounts);
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

  React.useEffect(() => {
    setVoxelResolution(getAutoVoxelResolution(pointCount));
  },[pointCount] )

  const search = () => {
    redditData.forEach((point) => {
      if (point.include && point.subreddit.toLowerCase() === searchTerm.toLowerCase()) {
        setSelectedId(point.id);
      }
    });
  };

  const { width, height } = useWindowSize();

  console.log(width * height * CLIP_SCALE_FACTOR);

  const mouseDownRef = React.useRef([0, 0]);
  const raycaster = new THREE.Raycaster();
  raycaster.params = {Points: { threshold: POINT_RADIUS * 0.01 }};

  const collisionGeometry = useMemo(() => {
    return redditData.filter(point => point.include).map(point => {
        const sphere = new Sphere (new Vector3(point.x, point.y, point.z), POINT_RADIUS);
        const collisionSphere = new CollisionSphere(sphere, point.id);
        return collisionSphere;
      }
    )
  }, [redditData]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    mouseDownRef.current[0] = event.clientX;
    mouseDownRef.current[1] = event.clientY;
  };

  const handleClick = (event: React.PointerEvent<HTMLDivElement>) => {
    const {clientX, clientY} = event;
    const downDistance = Math.sqrt(
      Math.pow(mouseDownRef.current[0] - clientX, 2) +
      Math.pow(mouseDownRef.current[1] - clientY, 2)
    );

    // skip click if we dragged more than 5px distance
    if (downDistance > 5) {
      event.stopPropagation();
      return;
    }
    const mouse = {
      x: ( event.clientX / window.innerWidth ) * 2 - 1,
      y: -( event.clientY / window.innerHeight ) * 2 + 1
    }

    raycaster.setFromCamera(mouse, camera);
    console.log(camera?.position, camera?.rotation);
    const intersects = raycaster.intersectObjects(collisionGeometry);

    if (intersects.length > 0) {
      const intersected = intersects[0].object as CollisionSphere;
      if (selectedId !== intersected.index) {
        setSelectedId(intersected.index);
        //console.log("Index: ", intersected.index);
        //console.log("Point: ", data[intersected.index]);
      }
      else {
        setSelectedId(null);
      }
    }
  }

  return (
    <div className="App">
      {loading && <LoadingOverlay message={"Loading dollops of dope data"}/>}
      {error && <span className={"error-message"}>{error.message}</span>}
      {!loading && !error && redditData && redditData.length && (
          <div className="vis-container" key={redditData.length}>
            <Canvas concurrent
                    camera={{position: [0, 0, 40], far: width * height * CLIP_SCALE_FACTOR}}
                    onCreated={gl => setCamera(gl.camera)}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handleClick}>
              <Stats/>
              {usePostProcessing && <Effects useAA useUnrealBloom />}
                  <ThreePointVis
                    data={redditData}
                    clusters={showClusterHulls ? clusters : []}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    pointResolution={pointResolution}
                    voxelResolution={voxelResolution}
                    debugVoxels={debugVoxels}
                  />
                )
            </Canvas>
          </div>)
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
                  max={MAX_POINT_RES}
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
                  onChange={(event) => {
                    setMaxPercentNSFW(+event.target.value);
                    if(selectedId && redditData[selectedId].percentNsfw > +event.target.value) {
                      setSelectedId(null);
                    }
                  }}
                />
                <br />
                <label htmlFor="usePostProcessing">
                  Enable Post FX:
                </label>
                <input
                  id="usePostProcessing"
                  type="checkbox"
                  checked={usePostProcessing}
                  onChange={(event) => setUsePostProcessing(event.target.checked)}
                />
                <br />
                <label htmlFor="showClusterHulls">
                  Show Cluster Hulls:
                </label>
                <input
                  id="showClusterHulls"
                  type="checkbox"
                  checked={showClusterHulls}
                  onChange={(event) => setShowClusterHulls(event.target.checked)}
                />
              </div>
              <div>
                <label htmlFor="numClusters" ># Clusters: </label>
                <select name="numClusters" id="numClusters" onChange={(event) => setClusterIndex(clusterCounts.indexOf(+event.target.value))}>
                  {clusterCounts.map(clusterCount => <option value={clusterCount} key={clusterCount}>{clusterCount}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="dataSet" ># Data Set: </label>
                <select name="dataSet" id="dataSet" onChange={(event) => setDataSet(dataSets[event.target.value as keyof dataSetList])}>
                  {Object.keys(dataSets).map(dataSet => <option value={dataSet} key={dataSet}>{dataSet}</option>)}
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
              <br />
              <label htmlFor="voxelResSlider">
                {" "}
                Voxel Resolution: {voxelResolution}
              </label>
              <input
                id="voxelResSlider"
                type="range"
                min={1}
                max={MAX_VOXEL_RES}
                value={voxelResolution}
                onChange={(event) => setVoxelResolution(+event.target.value)}
                step="1"
              />
              <br />
              <label htmlFor="debugVoxels">
                Show Voxel Debug:
              </label>
              <input
                id="debugVoxels"
                type="checkbox"
                checked={debugVoxels}
                onChange={(event) => setDebugVoxels(event.target.checked)}
              />
            </form>
            {/*glContext && <DebugStats gl={glContext}/> */}
          </>
        )}
      </div>
    </div>
  );
}
