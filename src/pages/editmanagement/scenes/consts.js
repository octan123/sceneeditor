export const MAP_NAME_LIST = [
  'curve_r100', 'curves', 'curves_elevation', 'e6mini',
  'fabriksgatan', 'jolengatan', 'multi_intersections', 'outOP121501', 'Roundabout8Course', 'soderleden', 'straight_500m'
]

export const ANTD_RADIO_STYLE = {
  display: 'block',
  height: '30px',
  lineHeight: '30px',
}

export const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection',
  features: [],
}

function hex2rgb(hex) {
  const value = parseInt(hex, 16);
  return [16, 8, 0].map((shift) => ((value >> shift) & 0xff) / 255);
}

export const FEATURE_COLORS = [
  '1579d7',
  '9BCC32',
  '07A35A',
  'F7DF90',
  'EA376C',
  '6A126A',
  'FCB09B',
  'B0592D',
  'C1B5E3',
  '9C805B',
  'CCDFE5',
].map(hex2rgb)