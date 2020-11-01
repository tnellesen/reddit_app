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
  MAX_VIEW_DISTANCE, MOBILE_THRESHOLD_WIDTH
} from "./constants";
import {Stats} from "./ThreePointVis/Stats";
import {Camera, Canvas} from "react-three-fiber";
import {Effects} from "./ThreePointVis/Effects";
import * as THREE from "three";
import {CollisionSphere} from "./CollisionSphere";
import {useMemo} from "react";
import {cleanTerm, DataList} from "./DataList";
import {
  useHistory,
  useLocation,
} from "react-router-dom";
import qs from 'query-string';
import { History, Location } from 'history';
import {PointInfo} from "./PointInfo/PointInfo";

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

export const pointCounts = [10000, 25000, 50000, 100000, 250000, 500000];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const setQueryParam = (key: string, value: string, history: History, location: Location) => {
  const queryParams = qs.parse(location.search);
  const newQueries = {...queryParams, [key]: value};
  history.push({search: qs.stringify(newQueries)});
}

export default function App() {
  let query = useQuery();
  let history = useHistory();
  let location = useLocation();
  const pointCount = parseInt(query.get("point_count") || '0', 10) || 25000;
  const dataSet = query.get("data_set") || dataSets[Object.keys(dataSets)[0]];
  const selection = (query.get("selection") || "").split(',') || [];

  const [redditData, setRedditData] = React.useState<Point[]>([]);
  const [clusters, setClusters] = React.useState<Cluster[]>([]);
  const [clusterCounts, setClusterCounts] = React.useState<number[]>([]);
  const [clusterIndex, setClusterIndex] = React.useState<number>(3); // TODO remove hard coding
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showControls, setShowControls] = React.useState(true);
  const [multiSelect, setMultiSelect] = React.useState(false);
  const [pointResolution, setPointResolution] = React.useState(
    Math.floor(Math.max(Math.min(window.innerWidth / 69, MAX_POINT_RES*0.75), 1))
  );
  const [maxPercentNSFW, setMaxPercentNSFW] = React.useState(10);
  const [usePostProcessing, setUsePostProcessing] = React.useState(true);
  const [useAntiAliasing, setUseAntiAliasing] = React.useState(window.innerWidth > MOBILE_THRESHOLD_WIDTH);
  const [usePerPointLighting, setUsePerPointLighting] = React.useState(window.innerWidth > MOBILE_THRESHOLD_WIDTH);
  const [showClusterHulls, setShowClusterHulls] = React.useState(false);
  const [voxelResolution, setVoxelResolution] = React.useState(getAutoVoxelResolution(pointCount));
  const [debugVoxels, setDebugVoxels] = React.useState(false);
  const [viewDistance, setViewDistance] = React.useState(
    Math.min(window.innerWidth * window.innerHeight * CLIP_SCALE_FACTOR, MAX_VIEW_DISTANCE));
  const [camera, setCamera] = React.useState<Camera>();
  const [dataList, setDataList] = React.useState<string[]>([]);
  
  const selectedPoints = useMemo(() => redditData.filter(point => selection.includes(point.subreddit)), [selection, redditData]);

  const [{ data, loading, error }] = useAxios(
    `https://redditexplorer.com/GetData/dataset:${dataSet},n_points:${pointCount}`
  );

  const setParam = (key: string, value: string) => setQueryParam(key, value, history, location);

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
      setRedditData(newRedditData);
      setDataList(newRedditData.filter(point => point.include).map(point => point.subreddit));
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
  },[viewDistance, camera] )

  const selectOrDeselectPoint = (index: number, isMultiSelect: boolean) => {
    const selectedIds = selectedPoints.map(point => point.id);
    if(isMultiSelect) {
      if (!selectedIds.includes(index)) {
        const newSelection = [...selection];
        newSelection.push(redditData[index].subreddit);
        setParam('selection', newSelection.join(','));
      }
      else {
        const newSelectedPoints = [...selectedPoints].filter(point => point.id !== index);
        setParam('selection', newSelectedPoints.map(p =>p.subreddit).join(','));
      }
    }
    else {
      if (selectedIds.length !== 1 || selectedIds[0] !== index) {
        setParam('selection', redditData[index].subreddit);
      }
      else {
        setParam('selection', '');
      }
    }
  }

  const search = (term: string) => {
    redditData.forEach((point) => {
      if (point.include && point.subreddit.toLowerCase() === cleanTerm(term)) {
        selectOrDeselectPoint(point.id, multiSelect);
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
        const clickedId = intersected.index;
        selectOrDeselectPoint(clickedId, multiSelect || event.ctrlKey);
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
              {(usePostProcessing || useAntiAliasing) &&
                <Effects useAA={useAntiAliasing} useUnrealBloom={usePostProcessing} />
              }
                  <ThreePointVis
                    data={redditData}
                    clusters={showClusterHulls ? clusters : []}
                    selectedPoints={selectedPoints}
                    onSelect={selectOrDeselectPoint}
                    pointResolution={pointResolution}
                    voxelResolution={voxelResolution}
                    debugVoxels={debugVoxels}
                    usePerPointLighting={usePerPointLighting}
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
            {!loading && data && selectedPoints.length !== 0 && (
              <>
                <h3>Selection:</h3>
                <div className="selected-points-info">
                  {selectedPoints.map(point => <PointInfo point={point} />)}
                </div>
              </>
            )}
            {selectedPoints.length > 0 &&
              (<>
                <button
                    onClick={() => setParam('selection', '')}>
                  Clear Selection
                </button>
                <br />
                </>)
            }
            <br />
              <DataList
                values={dataList.filter((value =>
                  value.toLowerCase().includes(cleanTerm(searchTerm))))}
                id={"subreddits"}
                onSelect={(value) => search(value)}
                onChange={(value) => setSearchTerm(value)}/>
              <button onClick={() => search(searchTerm)}>Search</button>
              <br/>
            <label htmlFor="multiSelect">
              Multi Select:
            </label>
            <input
              id="multiSelect"
              type="checkbox"
              checked={multiSelect}
              onChange={(event) => setMultiSelect(event.target.checked)}
            />
            <br />
            <br/>
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
                selectedPoints.filter(point => point.percentNsfw < +event.target.value)
                setParam('selection', selectedPoints.map(p => p.subreddit).join(','));
                //}
              }}
            />
            <div>
              <label htmlFor="pointCount" ># Points: </label>
              <select name="pointCount" id="pointCount" onChange={(event) => {
                //setSelectedIds([]);
                setParam('point_count', event.target.value)
              }}
                      value={pointCount}>
                {pointCounts.map(pointCount => <option value={pointCount} key = {pointCount}>{pointCount}</option>)}
              </select>
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
              <label htmlFor="dataSet" >Data Set: </label>
              <select name="dataSet" id="dataSet"
                      onChange={(event) => setParam('data_set', dataSets[event.target.value as keyof dataSetList])}
                      value={dataSets[dataSet]}>
                {Object.keys(dataSets).map(dataSet => <option value={dataSet} key={dataSet}>{dataSet}</option>)}
              </select>
            </div>
            <label htmlFor="showClusterHulls">
              Show Cluster Hulls:
            </label>
            <input
              id="showClusterHulls"
              type="checkbox"
              checked={showClusterHulls}
              onChange={(event) => setShowClusterHulls(event.target.checked)}
            />

            <br/>
            <br/>
            <h4>Performance Options</h4>
            <label htmlFor="usePostProcessing">
              Enable Post FX:
            </label>
            <input
              id="usePostProcessing"
              type="checkbox"
              checked={usePostProcessing}
              onChange={(event) => setUsePostProcessing(event.target.checked)}
            />
            <br/>
            <label htmlFor="useAntiAliasing">
              Anti-aliasing (FXAA):
            </label>
            <input
              id="useAntiAliasing"
              type="checkbox"
              checked={useAntiAliasing}
              onChange={(event) => setUseAntiAliasing(event.target.checked)}
            />
            <br />
            <label htmlFor="usePerPointLighting">
              Per Point Lighting:
            </label>
            <input
              id="usePerPointLighting"
              type="checkbox"
              checked={usePerPointLighting}
              onChange={(event) => setUsePerPointLighting(event.target.checked)}
            />
            <br/>
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

            <h4>Advanced / Debug</h4>
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
