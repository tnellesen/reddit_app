export const SCALE_FACTOR = 1;
export const CLIP_SCALE_FACTOR = 0.005;

export const POINT_RADIUS = 1.0 * SCALE_FACTOR;

export const MAX_POINT_RES = 32;

export const MIN_VOXEL_RES = 6;
export const MAX_VOXEL_RES = 12;

export const MIN_VIEW_DISTANCE = 100;
export const MAX_VIEW_DISTANCE = 20000;

export type dataSetList = {[name: string]: string};

export const dataSets: dataSetList = {
  Original: "original",
  New25: "new_0.25"
}

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
  "#372101"
];
