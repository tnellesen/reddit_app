import * as React from 'react';
import { useMemo } from 'react';
import './styles.scss';
import * as THREE from 'three';
import {
  Mesh, MOUSE, Sphere, Vector3,
} from 'three';
import useAxios from 'axios-hooks';
import { Canvas, Camera } from '@react-three/fiber';
import { useHistory, useLocation } from 'react-router-dom';
import qs from 'query-string';
import { History, Location } from 'history';
import {
  Tab, TabList, TabPanel, Tabs,
} from 'react-tabs';
import { ThreePointVis } from './ThreePointVis/ThreePointVis';
import { PointInfo } from './PointInfo/PointInfo';
import { cleanTerm, DataList } from './DataList/DataList';
import { CollisionSphere } from './CollisionSphere';
import { Stats } from './ThreePointVis/Stats';
import {
  CLIP_SCALE_FACTOR,
  dataSetList,
  dataSets,
  expandChar, MAX_DATA_CACHE_AGE_SECONDS,
  MAX_POINT_RES,
  MAX_VIEW_DISTANCE,
  MAX_VOXEL_RES,
  MIN_VIEW_DISTANCE,
  MIN_VOXEL_RES,
  minimizeChar,
  MOBILE_THRESHOLD_WIDTH,
  POINT_RADIUS,
} from './constants';
import { LoadingOverlay } from './LoadingOverlay/LoadingOverlay';
import { formatNumber, range, useLocalStorage } from './util';
import { useWindowSize } from './ViewportHooks';
import { ClusterHulls } from './ThreePointVis/ClusterHulls';
import { Effects } from './ThreePointVis/Effects';

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

enum ControlTabs {
  'EXPLORE',
  'PERFORMANCE',
  'ABOUT'
}

const getAutoVoxelResolution = (numberOfPoints: number) => Math.max(MIN_VOXEL_RES,
  Math.min(MAX_VOXEL_RES,
    Math.floor(Math.cbrt(numberOfPoints / 80))));

const pointCounts = [10000, 25000, 50000, 100000, 250000, 500000];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const setQueryParam = (key: string, value: string, history: History, location: Location) => {
  const queryParams = qs.parse(location.search);
  const newQueries = { ...queryParams, [key]: value };
  history.push({ search: qs.stringify(newQueries) });
};

export default function App() {
  const isMobile = window.innerWidth > MOBILE_THRESHOLD_WIDTH;
  const query = useQuery();
  const history = useHistory();
  const location = useLocation();
  const pointCount = parseInt(query.get('point_count') || '0', 10) || 25000;
  const dataSet = query.get('data_set') || dataSets[Object.keys(dataSets)[0]];
  const selection = useMemo(() => (query.get('selection') || '').split(',') || [], [query]);
  const hideUserAccounts = query.get('hideUserAccounts') === 'true';
  const { width, height } = useWindowSize();

  const [clusterIndex, setClusterIndex] = React.useState<number>(3); // TODO remove hard coding
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showAdvancedControls, setShowAdvancedControls] = React.useState(false);
  const [multiSelect, setMultiSelect] = React.useState(false);
  const [pointResolution, setPointResolution] = React.useState(
    Math.floor(Math.max(Math.min(4 + window.innerWidth / 320, MAX_POINT_RES * 0.75), 1)),
  );
  const [maxPercentNSFW, setMaxPercentNSFW] = React.useState(10);
  const [usePostProcessing, setUsePostProcessing] = React.useState(isMobile);
  const [useAntiAliasing, setUseAntiAliasing] = React.useState(isMobile);
  const [resolutionScale, setResolutionScale] = React.useState(Math.ceil(window.devicePixelRatio / 2));
  const [usePerPointLighting, setUsePerPointLighting] = React.useState(isMobile);
  const [showClusterHulls, setShowClusterHulls] = React.useState(false);
  const [isAutoCamera, setIsAutoCamera] = React.useState(true);
  const [voxelResolution, setVoxelResolution] = React.useState(getAutoVoxelResolution(pointCount));
  const [debugVoxels, setDebugVoxels] = React.useState(false);
  const [viewDistance, setViewDistance] = React.useState(
    Math.min(window.innerWidth * window.innerHeight * CLIP_SCALE_FACTOR, MAX_VIEW_DISTANCE),
  );
  const [camera, setCamera] = React.useState<Camera>();
  const [hasReadAboutPage, setHasReadAboutPage] = useLocalStorage<string>('hasReadAboutPage', '');
  const [showControls, setShowControls] = React.useState(isMobile || !hasReadAboutPage);
  const [tabIndex, setTabIndex] = React.useState(hasReadAboutPage ? ControlTabs.EXPLORE : ControlTabs.ABOUT);

  const [{ data: pointData, loading: pointsLoading, error: pointsError }] = useAxios({
    url: `https://redditexplorer.com/GetPoints/dataset:${dataSet},n_points:${pointCount}`,
    headers: { 'Cache-Control': `max-age=${MAX_DATA_CACHE_AGE_SECONDS}`, pragma: '' },
  });

  const setParam = (key: string, value: string) => setQueryParam(key, value, history, location);

  const redditData: Point[] = useMemo(() => (pointData
    ? pointData.data.map((point: any, index: number) => ({
      id: index,
      subreddit: point.subreddit,
      x: point.x,
      y: point.y,
      z: point.z,
      cluster: point.cluster[clusterIndex],
      percentNsfw: point.percentNsfw,
      include: point.percentNsfw <= maxPercentNSFW && !(hideUserAccounts && point.subreddit.startsWith('u_')),
    }))
    : []), [clusterIndex, pointData, hideUserAccounts, maxPercentNSFW]);

  const selectedPoints = useMemo(() => redditData.filter((point) => selection.includes(point.subreddit)).sort((a, b) =>
    a.subreddit.toLowerCase().localeCompare(b.subreddit.toLowerCase())),
  [selection, redditData]);

  const clusterCounts: number[] = useMemo(() => (pointData ? pointData.clusterCounts : []), [pointData]);
  const clusterCount = useMemo(() => clusterCounts[clusterIndex], [clusterCounts, clusterIndex]);
  const clusters = useMemo(
    () => (showClusterHulls
      ? <ClusterHulls dataSet={dataSet} pointCount={pointCount} clusterCount={clusterCount} />
      : null),
    [clusterCount, dataSet, pointCount, showClusterHulls],
  );

  const dataList = useMemo(() =>
    redditData.filter((point) => point.include).map((point) => point.subreddit).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())),
  [redditData]);

  React.useEffect(() => {
    setVoxelResolution(getAutoVoxelResolution(pointCount));
  }, [pointCount]);

  React.useEffect(() => {
    if (camera) {
      camera.far = viewDistance;
      camera.updateProjectionMatrix();
    }
  }, [viewDistance, camera]);

  const selectOrDeselectPoint = (id: number, isMultiSelect: boolean) => {
    const selectedIds = selectedPoints.map((point) => point.id);
    if (isMultiSelect) {
      if (!selectedIds.includes(id)) {
        const newSelection = [...selection];
        newSelection.push(redditData[id].subreddit);
        setParam('selection', newSelection.join(','));
      } else {
        const newSelectedPoints = [...selectedPoints].filter((point) => point.id !== id);
        setParam('selection', newSelectedPoints.map((p) => p.subreddit).join(','));
      }
    } else if (selectedIds.length !== 1 || selectedIds[0] !== id) {
      setParam('selection', redditData[id].subreddit);
    } else {
      setParam('selection', '');
    }
  };

  const search = (term: string, isMultiSelect?: boolean) => {
    redditData.forEach((point) => {
      if (point.include && point.subreddit.toLowerCase() === cleanTerm(term)) {
        selectOrDeselectPoint(point.id, isMultiSelect || multiSelect);
      }
    });
  };

  const mouseDownRef = React.useRef([0, 0]);
  const raycaster = new THREE.Raycaster();
  raycaster.params = { Points: { threshold: POINT_RADIUS * 0.01 } };

  const collisionGeometry = useMemo(() => redditData.filter((point) => point.include)
    .map((point) => {
      const sphere = new Sphere(new Vector3(point.x, point.y, point.z), POINT_RADIUS);
      return new CollisionSphere(sphere, point.id);
    }), [redditData]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button === MOUSE.LEFT) {
      mouseDownRef.current[0] = event.clientX;
      mouseDownRef.current[1] = event.clientY;
    }
  };

  const handleClick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button === MOUSE.LEFT) {
      const { clientX, clientY } = event;
      const downDistance = Math.sqrt(
        (mouseDownRef.current[0] - clientX) ** 2
        + (mouseDownRef.current[1] - clientY) ** 2,
      );

      // skip click if we dragged more than 5px distance
      if (downDistance > 7) {
        event.stopPropagation();
        return;
      }
      if (camera) {
        const mouse = {
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: -(event.clientY / window.innerHeight) * 2 + 1,
        };

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(collisionGeometry);

        if (intersects.length > 0) {
          const intersected = intersects[0].object as CollisionSphere;
          const clickedId = intersected.index;
          selectOrDeselectPoint(clickedId, multiSelect || event.ctrlKey);
        }
      }
    }
  };

  const resolutionScales = range(0.5, window.devicePixelRatio, 0.5);

  const resolutionOptions = useMemo(() => resolutionScales.map((scaleFactor, index) => {
    const suffix = `${scaleFactor * width}x${scaleFactor * height} ${index === resolutionScales.length - 1
      ? '(native)'
      : ''}`;
    return (
      <option
        value={scaleFactor}
        key={scaleFactor}
      >
        {`${scaleFactor}x -- ${suffix}`}
      </option>
    );
  }), [resolutionScales, width, height]);

  const effects = <Effects useAA={useAntiAliasing} useUnrealBloom={usePostProcessing} />;

  return (
    <div className="App">
      {pointsLoading && <LoadingOverlay message="Loading dollops of dope data" />}
      {pointsError && <span className="error-message">{pointsError.message}</span>}
      {!pointsLoading && !pointsError && redditData && redditData.length && (
      <div
        className="vis-container"
        role="presentation"
        key={`${redditData.length} ${resolutionScale}`}
        onMouseDown={handlePointerDown}
        onMouseUp={handleClick}
      >
        <Canvas
          gl={{
            antialias: false,
          }}
          dpr={resolutionScale}
          linear
          flat
          camera={{ position: [0, 0, 600], far: viewDistance }}
          onCreated={(gl) => setCamera(gl.camera)}
        >
          <Stats />
          {(usePostProcessing || useAntiAliasing) && effects}
          <ThreePointVis
            data={redditData}
            clusters={clusters}
            selectedPoints={selectedPoints}
            pointResolution={pointResolution}
            voxelResolution={voxelResolution}
            debugVoxels={debugVoxels}
            usePerPointLighting={usePerPointLighting}
            isAutoCamera={isAutoCamera}
          />
          )
        </Canvas>
      </div>
      )}
      <div className="controls">
        <div className="controls-title-bar">
          <h1 className="title">Reddit Explorer</h1>
          <button
            type="button"
            className="minimize-controls-button"
            onClick={() => setShowControls(!showControls)}
          >
            {showControls ? minimizeChar : expandChar}
          </button>
        </div>
        {showControls && (
          <Tabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
            <TabList>
              <Tab>Explore</Tab>
              <Tab>Performance</Tab>
              <Tab>About</Tab>
            </TabList>

            <TabPanel className="tab-panel explore-panel">
              <div className="search-section">
                <DataList
                  values={dataList.filter(((value) => value.toLowerCase().includes(cleanTerm(searchTerm))))}
                  id="subreddits"
                  onSelect={(value, isMultiSelect) => search(value, isMultiSelect)}
                  onChange={(value) => setSearchTerm(value)}
                />
                <button type="button" onClick={() => search(searchTerm)}>Search</button>
              </div>
              {!pointsLoading && pointData && selectedPoints.length !== 0 && (
                <>
                  <div className="selection-header">
                    <h3>Selection</h3>
                    <button
                      type="button"
                      onClick={() => setParam('selection', '')}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="selected-points-info">
                    {selectedPoints.map((point) => (
                      <PointInfo
                        key={point.id}
                        point={point}
                        onDeselect={() => selectOrDeselectPoint(point.id, true)}
                      />
                    ))}
                  </div>
                </>
              )}
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
              <br />
              <div>
                <label htmlFor="pointCount"># Points: </label>
                <select
                  name="pointCount"
                  id="pointCount"
                  onChange={(event) => {
                    // setSelectedIds([]);
                    setParam('point_count', event.target.value);
                  }}
                  value={pointCount}
                >
                  {pointCounts.map((pc) => <option value={pc} key={pc}>{pc}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="numClusters"># Clusters: </label>
                <select
                  name="numClusters"
                  id="numClusters"
                  onChange={(event) => setClusterIndex(clusterCounts.indexOf(+event.target.value))}
                  value={clusterCounts[clusterIndex]}
                >
                  {clusterCounts.map(
                    (count) => <option value={count} key={count}>{count}</option>,
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="dataSet">Data Set: </label>
                <select
                  name="dataSet"
                  id="dataSet"
                  onChange={(event) => setParam('data_set', dataSets[event.target.value as keyof dataSetList])}
                  value={dataSets[dataSet]}
                >
                  {Object.keys(dataSets).map((ds) => <option value={ds} key={ds}>{ds}</option>)}
                </select>
              </div>
              <label htmlFor="nsfwSlider">
                {' '}
                Max NSFW:
                {' '}
                {maxPercentNSFW}
                % &nbsp;
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
                }}
              />
              <label htmlFor="hideUserAccounts">
                Hide User Accounts:
              </label>
              <input
                id="hideUserAccounts"
                type="checkbox"
                checked={hideUserAccounts}
                onChange={(event) => setParam('hideUserAccounts', event.target.checked ? 'true' : 'false')}
              />
              <br />
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
              <br />
              <label htmlFor="isAutoCamera">
                Auto Camera:
              </label>
              <input
                id="isAutoCamera"
                type="checkbox"
                checked={isAutoCamera}
                onChange={(event) => setIsAutoCamera(event.target.checked)}
              />
            </TabPanel>

            <TabPanel className="tab-panel performance-panel">
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
              <br />
              <label htmlFor="resolutionSlider">
                {' '}
                Point Resolution:
                {' '}
                {pointResolution}
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
                {' '}
                View Distance:
                {' '}
                {formatNumber(viewDistance, 2)}
              </label>
              <input
                id="viewDistance"
                type="range"
                min={MIN_VIEW_DISTANCE}
                max={MAX_VIEW_DISTANCE}
                value={viewDistance}
                onChange={(event) => setViewDistance(+event.target.value)}
                step="1"
              />
              <div className="resolution-scale-section">
                <label htmlFor="pixelResolutionMultiplier">
                  Resolution Scale:&nbsp;
                </label>
                <select
                  name="pixelResolutionMultiplier"
                  id="pixelResolutionMultiplier"
                  onChange={(event) => setResolutionScale(+event.target.value)}
                  value={resolutionScale}
                >
                  {resolutionOptions}
                </select>
              </div>
              <div className="advanced-settings-title-bar">
                <h4>Advanced: </h4>
                <button
                  type="button"
                  className="minimize-controls-button"
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                >
                  {showAdvancedControls ? minimizeChar : expandChar}
                </button>
              </div>
              {showAdvancedControls
                  && (
                  <>
                    <label htmlFor="voxelResSlider">
                      {' '}
                      Voxel Resolution:
                      {' '}
                      {voxelResolution}
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
                  </>
                  )}
            </TabPanel>

            <TabPanel className="tab-panel about-panel">
              <p>Welcome to Reddit Explorer, your map to The Front Page of The Internet!</p>
              <p>
                Click or tap on some points to begin exploring, or search by name and view bigger data sets in the
                {' '}
                <button type="button" onClick={() => setTabIndex(ControlTabs.EXPLORE)}>Explore</button>
                {' '}
                tab.
              </p>
              <p>
                You can use Reddit Explorer to find new communities and topics similar to your current interests or
                just to see how different interests overlap across the internet.
                The top communities of Reddit are shown arranged by overlapping user interests.
                For more information, see TODO-insert Github or other links here.
              </p>
              <p>
                If the app
                is running slow, or if you have a more powerful device and want a prettier experience,
                you can experiment in the
                {' '}
                <button type="button" onClick={() => setTabIndex(ControlTabs.PERFORMANCE)}>Performance</button>
                {' '}
                tab.
              </p>
              <p>Have fun exploring!</p>
              {!hasReadAboutPage
                && (
                <>
                  <button
                    type="button"
                    className="acknowledge-about-button"
                    onClick={() => {
                      setHasReadAboutPage('true');
                      setTabIndex(ControlTabs.EXPLORE);
                    }}
                  >
                    Got it!
                  </button>
                  <br />
                </>
                ) }
              <br />
              <h4>Created By:</h4>
              <div>Data Science: Tyler Nellesen</div>
              <div>Application: John Morone</div>
            </TabPanel>
          </Tabs>
        )}
      </div>
    </div>
  );
}

App.displayName = 'App';
