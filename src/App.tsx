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
import useAxios from "axios-hooks";
import {LoadingOverlay} from "./LoadingOverlay/LoadingOverlay";
import {
  CLIP_SCALE_FACTOR,
  dataSetList,
  dataSets,
  MAX_POINT_RES,
  MIN_VOXEL_RES,
  POINT_RADIUS,
  MAX_VOXEL_RES,
  MIN_VIEW_DISTANCE,
  MAX_VIEW_DISTANCE
} from "./constants";
import {Stats} from "./ThreePointVis/Stats";
import {Camera, Canvas} from "react-three-fiber";
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
  const [pointCount, setPointCount] = React.useState<number>(25000);
  const [clusterCounts, setClusterCounts] = React.useState<number[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showControls, setShowControls] = React.useState(true);
  const [pointResolution, setPointResolution] = React.useState(
    Math.floor(Math.max(Math.min(window.innerWidth / 69, MAX_POINT_RES*0.75), 1))
  );
  const [maxPercentNSFW, setMaxPercentNSFW] = React.useState(10);
  const [usePostProcessing, setUsePostProcessing] = React.useState(true);
  const [showClusterHulls, setShowClusterHulls] = React.useState(false);
  const [dataSet, setDataSet] = React.useState<string>(dataSets[Object.keys(dataSets)[0]]);
  const [voxelResolution, setVoxelResolution] = React.useState(getAutoVoxelResolution(pointCount));
  const [debugVoxels, setDebugVoxels] = React.useState(false);
  const [viewDistance, setViewDistance] = React.useState(
    Math.min(window.innerWidth * window.innerHeight * CLIP_SCALE_FACTOR, MAX_VIEW_DISTANCE));
  const [camera, setCamera] = React.useState<Camera>();


  const [{ data, loading, error }] = useAxios(
    `https://redditexplorer.com/GetData/dataset:${dataSet},n_points:${pointCount}`
  );

  React.useEffect(() => {
    const newRedditData: Point[] = data
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

    if(newRedditData && newRedditData.length) {
      //const newSelectedNames = newRedditData.filter(point => redditData.map(point => point.subreddit).includes(point.subreddit));
      const selectedSubreddits = selectedIds.map(id => redditData[id].subreddit);
      const newSelectedIds: number[] = newRedditData.filter(point => selectedSubreddits.includes(point.subreddit)).map(point => point.id);

          //[...selectedIds].filter(id => newRedditData.map(point => point.name).includes(redditData[id].name));

      setRedditData(newRedditData);
      setSelectedIds(newSelectedIds);
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

  React.useEffect(() => {
    if(camera) {
      camera.far = viewDistance;
      camera.updateProjectionMatrix();
    }
  },[viewDistance] )

  const search = () => {
    redditData.forEach((point) => {
      if (point.include && point.subreddit.toLowerCase() === searchTerm.toLowerCase()) {
        const newSelectedIds = [...selectedIds];
        newSelectedIds.push(point.id);
        console.log(newSelectedIds);
        console.log(newSelectedIds[newSelectedIds.length-1]);
        setSelectedIds(newSelectedIds);
      }
    });
  };

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
    if(camera) {
      const mouse = {
        x: ( event.clientX / window.innerWidth ) * 2 - 1,
        y: -( event.clientY / window.innerHeight ) * 2 + 1
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(collisionGeometry);

      if (intersects.length > 0) {
        const intersected = intersects[0].object as CollisionSphere;
        if (!selectedIds.includes(intersected.index)) {
          const newSelectedIds = [...selectedIds];
          console.log("selectedIds:", selectedIds);
          console.log("res:", newSelectedIds);
          newSelectedIds.push(intersected.index);
          console.log("res:", newSelectedIds);
          //console.log("res:", res.push(intersected.index));
          setSelectedIds(newSelectedIds);
          console.log("selectedIds:", selectedIds);
          //console.log("Index: ", intersected.index);
          //console.log("Point: ", redditData[intersected.index]);
        }
        else {
          const newSelectedIds = [...selectedIds];
          setSelectedIds(newSelectedIds.filter(id => id !== intersected.index));
        }
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
                    camera={{position: [0, 0, 40], far: viewDistance}}
                    onCreated={gl => setCamera(gl.camera)}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handleClick}>
              <Stats/>
              {usePostProcessing && <Effects useAA useUnrealBloom />}
                  <ThreePointVis
                    data={redditData}
                    clusters={showClusterHulls ? clusters : []}
                    selectedIds={selectedIds}
                    onSelect={setSelectedIds}
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
            {!loading && data && selectedIds.length !== 0 && (
              <div className="selected-point">
                You selected{" "}
                <a
                  href={`https://www.reddit.com/r/${redditData[selectedIds[selectedIds.length-1]].subreddit}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>{redditData[selectedIds[selectedIds.length-1]].subreddit}</strong>
                </a>
                <p>X: {redditData[selectedIds[selectedIds.length-1]].x}</p>
                <p>Y: {redditData[selectedIds[selectedIds.length-1]].y}</p>
                <p>Z: {redditData[selectedIds[selectedIds.length-1]].z}</p>
                <p>% NSFW: {redditData[selectedIds[selectedIds.length-1]].percentNsfw}</p>
              </div>
            )}
            {selectedIds.length > 0 &&
              (<>
                <button
                    onClick={() => setSelectedIds([])}>
                  Clear Selection
                </button>
                <br />
                </>)
            }
            <br />
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
            </form>
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
                  Max % NSFW Threads: {maxPercentNSFW}
                </label>
                <input
                  id="nsfwSlider"
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={maxPercentNSFW}
                  onChange={(event) => {
                    setMaxPercentNSFW(+event.target.value);
                    //if(redditData.filter(point => point.percentNsfw > +event.target.value).length > 0) {
                    selectedIds.filter(id => redditData[id].percentNsfw < +event.target.value)
                    setSelectedIds(selectedIds);
                    //}
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
                <select name="numClusters" id="numClusters"
                        onChange={(event) => setClusterIndex(clusterCounts.indexOf(+event.target.value))}
                        value={clusterCounts[clusterIndex]}>
                  {clusterCounts.map(clusterCount => <option value={clusterCount} key={clusterCount}>{clusterCount}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="dataSet" ># Data Set: </label>
                <select name="dataSet" id="dataSet"
                        onChange={(event) => setDataSet(dataSets[event.target.value as keyof dataSetList])}
                        value={dataSets[dataSet]}>
                  {Object.keys(dataSets).map(dataSet => <option value={dataSet} key={dataSet}>{dataSet}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pointCount" ># Points: </label>
                <select name="pointCount" id="pointCount" onChange={(event) => {
                  //setSelectedIds([]);
                  setPointCount(+event.target.value);
                }}
                value={pointCount}>
                  {pointCounts.map(pointCount => <option value={pointCount} key = {pointCount}>{pointCount}</option>)}
                </select>
              </div>
              <br />
              <label htmlFor="viewDistance">
                {" "}
                View Distance: {viewDistance}
              </label>
              <input
                id="voxelResSlider"
                type="range"
                min={MIN_VIEW_DISTANCE}
                max={MAX_VIEW_DISTANCE}
                value={viewDistance}
                onChange={(event) => setViewDistance(+event.target.value)}
                step="1"
              />
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
            {/*glContext && <DebugStats gl={glContext}/> */}
          </>
        )}
      </div>
    </div>
  );
}
