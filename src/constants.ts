export const SCALE_FACTOR = 1;
export const CLIP_SCALE_FACTOR = 0.005;

export const POINT_RADIUS = 1.0 * SCALE_FACTOR;

export const MAX_POINT_RES = 32;

export const MIN_VOXEL_RES = 6;
export const MAX_VOXEL_RES = 12;

export const MIN_VIEW_DISTANCE = 100;
export const MAX_VIEW_DISTANCE = 20000;

export const SELECTED_COLOR = "#5E5";

export const minimizeChar = '⁠–⁠';
export const expandChar = '+';

export type dataSetList = {[name: string]: string};

export const dataSets: dataSetList = {
  Latest: "new_2.0",
  Testing: "new_4.0",
  Legacy: "original"
}

// Threshold for auto disabling expensive graphical effects
export const MOBILE_THRESHOLD_WIDTH = 950; // A little under half 1080p

//https://coolors.co/263b3b-0b195e-bc3c00-773b08-541818-340534-0e2412-3b0c1a-790579-0d620b
export const clusterColors = [
  "#263b3b",
  "#0b195e",
  "#bc3c00",
  "#773b08",
  "#541818",
  "#340534",
  "#0e2412",
  "#3b0c1a",
  "#790579",
  "#0d620b",
  "#FFFF00", //added from https://graphicdesign.stackexchange.com/a/3815
  "#1CE6FF",
  "#FF34FF",
  "#FF4A46",
  "#008941",
  "#006FA6",
  "#A30059",
  "#FFDBE5",
  "#7A4900",
  "#0000A6",
  "#63FFAC",
  "#B79762",
  "#004D43",
  "#8FB0FF",
  "#997D87",
  "#5A0007",
  "#809693",
  "#FEFFE6",
  "#1B4400",
  "#4FC601",
  "#3B5DFF",
  "#4A3B53",
  "#FF2F80",
  "#61615A",
  "#BA0900",
  "#6B7900",
  "#00C2A0",
  "#FFAA92",
  "#FF90C9",
  "#B903AA",
  "#D16100",
  "#DDEFFF",
  "#000035",
  "#7B4F4B",
  "#A1C299",
  "#300018",
  "#0AA6D8",
  "#013349",
  "#00846F",
  "#372101",
  "#FFB500",
  "#C2FFED",
  "#A079BF",
  "#CC0744",
  "#C0B9B2",
  "#C2FF99",
  "#001E09",
  "#00489C",
  "#6F0062",
  "#0CBD66",
  "#EEC3FF",
  "#456D75",
  "#B77B68",
  "#7A87A1",
  "#788D66",
  "#885578",
  "#FAD09F",
  "#FF8A9A",
  "#D157A0",
  "#BEC459",
  "#456648",
  "#0086ED",
  "#886F4C",
  "#34362D",
  "#B4A8BD",
  "#00A6AA",
  "#452C2C",
  "#636375",
  "#A3C8C9",
  "#FF913F",
  "#938A81",
  "#575329",
  "#00FECF",
  "#B05B6F",
  "#8CD0FF",
  "#3B9700",
  "#04F757",
  "#C8A1A1",
  "#1E6E00",
  "#7900D7",
  "#A77500",
  "#6367A9",
  "#A05837",
  "#6B002C",
  "#772600",
  "#D790FF",
  "#9B9700",
  "#549E79",
  "#FFF69F",
  "#201625",
  "#72418F",
  "#BC23FF",
  "#99ADC0"
];
