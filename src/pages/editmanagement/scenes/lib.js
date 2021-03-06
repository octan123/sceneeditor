import axios from '@src/http'
import { PathLayer, TextLayer } from '@deck.gl/layers'
import { PathMarkerLayer } from 'nebula.gl'
import { PathStyleExtension } from '@deck.gl/extensions'
import { message } from 'antd'
import YAML from 'yaml'
import { FEATURE_COLORS } from './consts'
import _ from 'lodash'
import { createDefaultTirgger } from './trigger'
import moment from 'moment';
import localForage from 'localforage'
import VehicleImg from './imgs/vehicle2.png'
import mapJSON from './imgs/outOP121501_map.json'

export const POSITION_RATE = 300
export function groupFeatures(features) {
  return _.groupBy(features, f => f.geometry.type)
}

export function getMapList() {
}

export function getBezier(feature) {
  const pointslength = feature.geometry.coordinates.length

  const pointsarray = feature.geometry.coordinates.map((d, i) => ({
    x: d[0] * POSITION_RATE,
    y: d[1] * POSITION_RATE,
    heading: feature.properties.headings[i]
  }))
  return axios.get(`/nodeapi/getBezier`, {
    params: {
      type: 0,
      pointsarray,
      pointslength
    }
  }).then(data => {
    return data.data
  })
}

export function getBounds(points) {
  const x = points.map(p => p[0]);
  const y = points.map(p => p[1]);

  const xMin = Math.min.apply(null, x);
  const xMax = Math.max.apply(null, x);
  const yMin = Math.min.apply(null, y);
  const yMax = Math.max.apply(null, y);

  return [xMin, yMin, xMax, yMax];
}

export function getOdrmapBounds(odrMapData) {
  const pathFeatures = _.flatMap(Object.values(odrMapData))
  const points = _.flatMap(pathFeatures, (n) => {
    return n.path ?? [];
  })
  return getBounds(points)
}

export function fitBounndsForOdrmap({
  width = 888,
  height = 888,
  bounds,
  padding = 20
}) {
  const [xMin, yMin, xMax, yMax] = bounds
  // const size = [Math.abs(xMax - xMin), Math.abs(yMax - yMin)]
  // const targetSize = [width - padding * 2, height - padding * 2]
  // const scaleX = targetSize[0] / size[0]
  // const scaleY = targetSize[1] / size[1]
  // let zoom = Math.log2(Math.abs(Math.min(scaleX, scaleY)))
  // zoom = zoom < 0 ? 0 : zoom
  // ??????zoom = 10
  return {
    // target: [(xMin + xMax) / 2, (yMin + yMax) / 2],
    target: [xMin, yMax],
    zoom: 11
  }
}
export const getMapCenter = (point1, point2) => {
  return {
    target: [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2],
    zoom: 9.5
  }
}
export const getIconScale = zoom => {
  if (zoom === 10) {
    return 5
  }
  if (zoom >= 13) {
    return zoom
  }
  if (zoom < 10) {
    return (zoom) * 0.4
  }
  if (zoom < 9) {
    return (zoom) * 2
  }
  return (zoom) * 0.6
}

export const getMapDataFunc = (data) => {
  let sIndex = 0, dIndex = 0, pIndex = 0
  const mapData = {
    solidLines: [],
    dashedLines: [],
    pointLines: [],
    laneText: [],
  }
  let roadId = '';
  
  const getLines = function (arr, key) {
    if (typeof (arr[0]) === 'string') {
      arr.forEach((item, index) => {
        if (item instanceof Array) {
          getLines(item, arr[index - 1])
        } else if (typeof item === 'number') {
          roadId = item;
        }
      })
    } else if (!!arr[0]?.x) {
      switch (key) {
        case 'SolidLine':
          mapData.solidLines.push({
            getWidth: d => 50,
            path: arr.map(i => [i.x / POSITION_RATE, i.y / POSITION_RATE]),
            name: 'SolidPathLayer' + sIndex,
            color: [255, 255, 255]
          })
          sIndex++
          break
        case 'BrokenLine':
          mapData.dashedLines.push({
            getWidth: d => 50,
            path: arr.map(i => [i.x / POSITION_RATE, i.y / POSITION_RATE]),
            name: 'DashedPathLayer' + dIndex,
            color: [255, 255, 255]
          })
          dIndex++
          break
        case 'Point':
          mapData.pointLines.push({
            getWidth: d => 50,
            path: arr.map(i => [i.x / POSITION_RATE, i.y / POSITION_RATE]),
            name: 'PointPathLayer' + pIndex,
            color: [255, 255, 255]
          })
          mapData.laneText.push({
            name: roadId.toString(),
            coordinates: [arr[0]?.x / POSITION_RATE, arr[0]?.y / POSITION_RATE],
          })
          pIndex++
          break
      }
    }
  }
  getLines(data.Roads)
  return mapData
}

export async function getMapData({ filePath, fileName }) {
  return getMapDataFunc(mapJSON);
}
// ????????????
const beApartFromNumArr = (arr, num) => {
  const newArr = []
  for (let i = 0; i < arr.length; i++) {
    let obj = {}
    let arr2 = []
    for (let j = 0; j < arr[i].path.length; j += 10) {
      arr2.push(arr[i].path[j])
      arr2.push((arr[i].path[j + 4]))
    }
    obj = Object.assign({}, arr[i])
    obj.path = arr2
    newArr.push(obj)
  }
  return newArr
}
export function transOdrmapToLayers(mapData) {
  let newArr = []
  mapData?.pointLines?.map(item => {
    item?.path?.map((item2, index2) => {
      newArr.push(item2)
    })
  })
  
  // ????????????
  // const ICON_MAPPING = {
  //   marker: { x: 0, y: 0, width: 100, height: 100, mask: true, }
  // }

  const hexToRgb = (hex) => {
    var bigint = parseInt(hex, 16)
    var r = (bigint >> 16) & 255
    var g = (bigint >> 8) & 255
    var b = bigint & 255
    return r + "," + g + "," + b
  }
  
  const layers = [
    // ??????????????????
    new PathLayer({
      id: 'path-layer-solid',
      widthUnits: 'pixels',
      rounded: true,
      data: mapData.solidLines,
      getWidth: d => 2,
      highlightColor:true,
      getColor: d => [105, 105, 105],
    }),
    new PathLayer({
      id: 'path-layer-dashed',
      highlightColor:true,
      widthUnits: 'pixels',
      rounded: true,
      data: mapData.dashedLines,
      getWidth: d => 2,
      getColor: d => [105, 105, 105],
      getDashArray: [15, 20],
      dashJustified: true,
      extensions: [new PathStyleExtension({ dash: true, highPrecisionDash: true })]
    }),
    // new PathLayer({
    //   id: 'path-layer-lanes',
    //   widthUnits: 'pixels',
    //   rounded: true,
    //   data: mapData.pointLines,
    //   getWidth: d => 2,
    //   getColor: d => [255, 0, 0]
    // }),
    // display arrow
    new PathMarkerLayer({
      id: 'marker-layer',
      data: mapData.pointLines,
      sizeScale: 0.01,
      getPath: d => d.path,
      highlightColor:true,
      getColor: d => hexToRgb(d.color),
      getMarkerColor: x =>[105, 105, 105],
      getDirection: x => ({ forward: true }),
      getWidth: d => 1
    }),
    new TextLayer({
      id: 'text-layer',
      data: mapData.laneText,
      getPosition: d => d.coordinates,
      getText: d => d.name,
      // getColor: [105, 105, 105],
      getSize: 0.001,
      sizeUnits: 'meters',
    }),

    // ????????????
    // new IconLayer({
    //   id: 'path-layer-lanes',
    //   widthUnits: 'pixels',
    //   rounded: true,
    //   data: newArr,
    //   getColor: d => [255, 0, 0],
    //   iconAtlas: VehicleImg,
    //   iconMapping: ICON_MAPPING,
    //   getIcon: d => 'marker',
    //   sizeUnits: 'pixels',
    //   getSize: 3,
    //   getPosition: d => d,
    // })
  ]
  return layers
}
export async function getLayersByOdrId(fileName) {
  const mapData = await getMapData(fileName)
  const layers = transOdrmapToLayers(mapData)
  return layers
}

export const getDeckColorForFeature = (index, bright, alpha) => {
  const length = FEATURE_COLORS.length;
  const color = FEATURE_COLORS[index % length].map((c) => c * bright * 255);

  return [...color, alpha * 255];
}
const getRectCenterPoint = (arr) => {
  const [x, y] = [(arr[0][0] + arr[2][0]) / 2, (arr[0][1] + arr[2][1]) / 2]
  return {
    position: { x: x * POSITION_RATE, y: y * POSITION_RATE },
    size: {
      width: Math.abs(arr[0][0] - arr[2][0]) * POSITION_RATE,
      height: Math.abs(arr[0][1] - arr[2][1]) * POSITION_RATE
    }
  }
}
const mapToTrigger = (feature) => {
  const { properties: props, geometry: geo } = feature
  const trigger = {
    id: 1,
    position: {
      x: 0,
      y: 0
    },
    size: {
      width: 3,
      height: 3
    },
    rotation: 0,
    triggeredId: 0 //props.triggerId
  }
  trigger.id = props.id
  return {
    ...trigger,
    ...getRectCenterPoint(geo.coordinates[0])
  }
}

const mapToAgent = (feature) => {
  const { properties: props, geometry: geo } = feature
  const agent = {
    type: "vehicle",
    id: null,
    actImmediately: false,
    routes: [],
  }
  if (geo.type === "Point") {
    agent.triggers = null;
  } else {
    agent.triggers = [
      {
        id: feature.bindTriggerId,
      }
    ]
  }
  agent.id = props.id
  agent.actImmediately = !!props.actImmediately
  agent.routes = geo.coordinates.map((point, index) => {
    return {
      position: {
        x: point[0] * POSITION_RATE,
        y: point[1] * POSITION_RATE
      },
      heading: _.get(props, `headings.${index}`, 0),
      velocity: _.get(props, `velocity.${index}`, 0),
      time: _.get(props, `time.${index}`, 0)
    }
  })
  return agent
}

const getCreateTaskJsonData = (features) => {
  const data = {
    Triggers: [],
    Agents: []
  }
  let mainCar = [];
  const tempCoordinates = [];
  const tempHeadings = []
  features.forEach((fea) => {
    if (fea.properties.id === 0) {
      mainCar = fea;
    }
    switch (fea.geometry.type) {
      case 'Polygon':
        data.Triggers.push(mapToTrigger(fea))
        break
      case 'LineString':
        data.Agents.push(mapToAgent(fea))
        break
      case 'Point':
        tempCoordinates.push([fea.geometry.coordinates[0], fea.geometry.coordinates[1]]);
        if (fea.properties.headings) {
          if (Array.isArray(fea.properties.headings)) {
            tempHeadings.push(...fea.properties.headings)
          } else {
            tempHeadings.push(fea.properties.headings)
          }
        }
        break;
      default:
        break
    }
  })
  mainCar.geometry.coordinates = tempCoordinates;
  // if (data.Agents[0].id !== 0) {
  //   mainCar.properties.headings = [data.Agents[0].routes[0].heading];
  // }
  mainCar.properties.headings = tempHeadings
  data.Agents.push(mapToAgent(mainCar));
  return data
}

const createTaskMapToBE = (features) => {
  const jsonData = getCreateTaskJsonData(features)
  const yamlDoc = new YAML.Document()
  yamlDoc.contents = jsonData
  return yamlDoc.toString()
}

// ??????testFeatures ???????????????????????????????????????????????????????????????id???0???
const hasMainVehicle = (testFeatures) => {
  const features = testFeatures.features
  if (features.length) {
    const mainFeatures = features[0]
    if (mainFeatures.properties.id === 0 && mainFeatures.geometry.type === 'Point') {
      return true
    }
    return false
  }
  return false
}
const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export const createScenes = (params) => {
  console.log('params', params);
}
const editScenes = (params) => {
  console.log('params', params);
  return axios.post('/api/simu-mgr/tasktemplate/edit', params)
}

export const createTask = async (props) => {
  const { mapId, testFeatures, setIsCreating2, scenesName, selectedArr, description,
    screenshotCallback,
    isEdited,
    id
  } = props
  const testFeatures2 = JSON.parse(JSON.stringify(testFeatures))
  if (!hasMainVehicle(testFeatures)) {
    message.warning('???????????????????????????????????????????????????')
    return
  }
  if (!scenesName) {
    message.warning('??????????????????')
    return
  }
  if (testFeatures.features.length >= 2) {
    await screenshotCallback()
  }
  // ??????550???????????????????????????
  // await sleep(500)
  const yamlContent = createTaskMapToBE(testFeatures.features)
  let params
  console.log(yamlContent)
  setIsCreating2(true)
  let res
  if (!isEdited) {
    params = {
      name: scenesName,
      description,
      mapId,
      yamlContent,
      scenarioData: JSON.stringify(testFeatures2),
      scenarioImage: localStorage.getItem('localScreensHot'),
      labelsId: selectedArr
    }
    res = await createScenes(params)
  }else {
    params = {
      name: scenesName,
      description,
      mapId,
      id,
      yamlContent,
      scenarioData: JSON.stringify(testFeatures2),
      scenarioImage: localStorage.getItem('localScreensHot'),
      labelsId: selectedArr
    }
    res = await editScenes(params)
  }
  
  if (res?.data?.retCode === 'succeeded') {
    message.success(`${isEdited ? `??????????????????` : `??????????????????`}`, 1.5, () => {
      window.location.href = `/sceneslist`
    })
    setIsCreating2(false)
  }


  // ?????????????????????????????????
  // let msg = 'Loading...'
  // const taskName = `????????????-${new Date().getMonth() + 1}-${new Date().getDate()
  //   }-${new Date().getHours()}`
  // setIsCreating(true)
  // message.loading({ content: msg, key: 'createTask' })
  // axios.post('/api/simu-mgr/test-task/create', {
  //   name: taskName,
  //   mapId,
  //   runImmediately: true,
  //   yamlContent: createTaskMapToBE(testFeatures.features),
  //   openxshowImageId: 14,
  //   algImageId: -1
  // })
  //   .then(function (response) {
  //     message.success({ content: `?????????${taskName}???????????????`, key: 'createTask', duration: 2, style: { marginTop: '40vh' } })
  //     console.log(response);
  //   })
  //   .catch(function (error) {
  //     message.error({ content: `?????????${taskName}???????????????`, key: 'createTask', duration: 2, style: { marginTop: '40vh' } })
  //     console.log(error);
  //   }).then(function () {
  //     // always executed
  //     setIsCreating(false)
  //   })
}

export const createLocalTask = async ({ mapId, testFeatures }, setIsCreating, screenshotCallback) => {
  if (!hasMainVehicle(testFeatures)) {
    message.warning('???????????????????????????????????????????????????')
    return
  }

  if (testFeatures.features.length >= 2) {
    screenshotCallback()
  }
  // ??????550???????????????????????????
  await sleep(500)
  const data = {
    imgUrl: localStorage.getItem('localScreensHot'),
    createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
    name: `local_${mapId}_${moment().format('YYYY-MM-DD_HH:mm:ss')}`,
    mapId,
    data: createTaskMapToBE(testFeatures.features),
    status: 'init',
    result: 'null',
    collectTag: false,
  };

  setIsCreating(true);
  localForage.getItem('localSim').then((val) => {
    console.log('get_val', val);
    if (val === null) val = [];
    val.push(data);
    localForage.setItem('localSim', val).then((val) => {
      console.log('set_val', val);
      setIsCreating(false);
      message.success({ content: '??????????????????????????????!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
      window.location.href = '/task/local'
    }).catch((err) => {
      console.log('set_err', err);
      setIsCreating(false);
      message.error({ content: '??????????????????????????????!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
    })
  }).catch((err) => {
    console.log('get_err', err);
    setIsCreating(false);
    message.error({ content: '??????????????????????????????!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
  })

  // setIsCreating(true);
  // const db = new Dexie('simulation');
  // db.version(1).stores({
  //   task: '++id,createTime,name,mapId,data,status,result'
  // });
  // db.open().catch((err) => {
  //   console.log('localData open fail');
  // });
  // db.task.add(data).then(() => {
  //   message.success({ content: '??????????????????????????????!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
  //   setIsCreating(false);
  //   window.location.href = '/task/local';
  // }).catch(e => {
  //   console.log('localStaskError', e);
  //   message.error({ content: '??????????????????????????????!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
  //   setIsCreating(false);
  // });
}

// ?????????????????????????????????????????????????????????DrawLineString??? ????????????????????? trigger
export const createCurrentLineTrigger = (data, zoom, index) => {
  const toNumber = n => {
    return n
  }
  const featuresArr = data.features
  let lastMode
  if (featuresArr && featuresArr.length) {
    // ???????????????????????????????????????????????????????????????
    lastMode = featuresArr[featuresArr.length - 1]
  }
  if (lastMode.geometry && lastMode.geometry.type === 'LineString') {
    const lineStartPosition = lastMode.geometry.coordinates[0]
    // ????????????????????????????????????????????????????????????????????????+-150, 30/10*??????zomm
    const xValue = 150 / (zoom > 10 ? zoom + 4 : zoom) / POSITION_RATE
    const yValue = 50 / (zoom > 10 ? zoom + 4 : zoom) / POSITION_RATE
    let triggerPosition = []
    const topLeft = [toNumber(lineStartPosition[0] - xValue), toNumber(lineStartPosition[1] + yValue)]
    const topRgt = [toNumber(lineStartPosition[0] + xValue), toNumber(lineStartPosition[1] + yValue)]
    const bottomLeft = [toNumber(lineStartPosition[0] - xValue), toNumber(lineStartPosition[1] - yValue)]
    const bottomRgt = [toNumber(lineStartPosition[0] + xValue), toNumber(lineStartPosition[1] - yValue)]
    triggerPosition.push(topLeft, topRgt, bottomRgt, bottomLeft, topLeft)
    const insertFeatures = createDefaultTirgger(triggerPosition, index)
    if (insertFeatures) {
      data.features.push(insertFeatures)
      return data
    }
    return data
  }
}

export const getFeaturesTypeArr = (data, type) => {
  if (!data || !data.features.length) {
    return []
  }
  const featuresArr = data.features
  const newArr = []
  const obj = {}
  const tirggerIdArr = []
  featuresArr.map((item, index) => {
    if (item.geometry.type === type) {
      tirggerIdArr.push(index)
    }
    if (item.bindTriggerId) {
      if (!obj[item.bindTriggerId]) {
        obj[item.bindTriggerId] = [item]
      } else {
        obj[item.bindTriggerId].push(item)
      }
    }
  })
  for (let i in obj) {
    newArr.push({
      bindTriggerId: i,
      child: obj[i]
    })
  }
  return newArr
}

// ??????????????????????????????
const getAcceleration = (s, v, t) => {
  if (t <= 0) {
    return 0
  }
  let a = 2 * (s - v * t)
  a = a / Math.pow(t, 2)
  console.log('?????????????????????', a)
  return a
}

// ??????????????????????????????????????????
// s ????????? v ???????????????????????? t ?????????????????????????????????????????????
export const getNextSpeed = (s, v, t) => {
  console.log('????????????????????????', v)
  const a = getAcceleration(s, v, t)
  const speed = v + a * t
  console.log('?????????????????????', speed)
  return speed
}

// t = 2s / v1 + v2
export const getNextTime = (s, v1, v2) => {
  let time = 2 * s / (Number(v1) + Number(v2))
  console.log('?????????????????????', time)
  return time
}

const getTwoPointDistance = (p1, p2) => {
  let x
  let y
  let _s
  x = Math.abs(p1[0] - p2[0])
  y = Math.abs(p1[1] - p2[1])
  x = Math.pow(x, 2)
  y = Math.pow(y, 2)
  _s = Math.sqrt(x + y)

  return _s
}

// ??????????????????????????????????????????
export const getBezierDistance = (arr) => {
  let newArr = []
  arr.map(item => {
    let s = 0
    item.map((item2, index2) => {
      let x
      let y
      let _s
      if (index2 < item.length - 1) {
        // ??????????????????????????????
        x = Math.abs(item[index2].x - item[index2 + 1].x)
        y = Math.abs(item[index2].y - item[index2 + 1].y)
        // ???????????????
        x = Math.pow(x, 2)
        x = Math.pow(y, 2)
        // ?????????
        _s = Math.sqrt(x + y)
        s += _s
      }
    })
    newArr.push(s)
  })
  return newArr
}

export const getAuxiliaryArr = (data) => {
  // ???????????????
  let newArr = []
  data?.pointLines.map(item => {
    item?.path?.map((item2, index2) => {
      newArr.push(item2)
    })
  })
  // console.log('newArr', newArr.length)
  return newArr
}

export const getOriginAuxiliary = (data) => {
  const arrResult = [];
  data?.pointLines.map(item => {
    arrResult.push(item);
  });
  return arrResult;
}

const calculationAngle = (centerCoord, auxiliary, originAuxiliary) => {
  const r = 0.012302029034879378
  let distanceArr = []
  let intersectionArr = []
  let intersectionArrIndex = []
  const pathNameArr = [];
  auxiliary.map((item, index) => {
    // if (getTwoPointDistance(centerCoord, item) <= r) {
    //   // console.log('?????????????????????',getTwoPointDistance(centerCoord,item))
    //   intersectionArr.push(item)
    //   intersectionArrIndex.push(index)
    // }

    // ???????????????????????????????????????
    if (getTwoPointDistance(centerCoord, item)) {
      distanceArr.push(getTwoPointDistance(centerCoord, item))
    }
  })
  originAuxiliary.map(val => {
    val.path.map(item => {
      pathNameArr.push(val.name)
    })
  })
  // ??????????????????
  let minDistance = Math.min(...distanceArr)
  let minDistanceIndex = distanceArr.indexOf(minDistance)
  const pathName = pathNameArr[minDistanceIndex];
  let tag = false;
  let originAuxIndex = 0;
  let selectArray = [];
  originAuxiliary.map(val => {
    if(val.name === pathName) {
      // ????????????pathName????????????????????????????????????pathArray?????????math.min(arr.length, 20);
      val.path.forEach((item, index) => {
        if(item[0] === auxiliary[minDistanceIndex][0]) {
          tag = true;
          originAuxIndex = index;
        }
      })
      if(tag) {
        const data = val.path.slice(originAuxIndex, Math.min(val.path.length - 1 - originAuxIndex, 20));
        const selectLength = Math.min(val.path.length, 20);
        
        const leftSelectArr = [];
        const rightSelectArr = [];
        for(let i = 1; i <= 20; i++) {
          if(val.path?.[originAuxIndex + i]) {
            if(leftSelectArr.length + rightSelectArr.length < 19) {
              rightSelectArr.push(val.path[originAuxIndex + i]);
            }
          }
          if(val.path?.[originAuxIndex - i]) {
            if(leftSelectArr.length + rightSelectArr.length < 19) {
              leftSelectArr.push(val.path[originAuxIndex - i]);
            }
          }
        }
        selectArray = selectArray.concat(leftSelectArr.reverse());
        selectArray.push(val.path[originAuxIndex]);
        selectArray = selectArray.concat(rightSelectArr);
      }
    }
  })
  
  intersectionArr.push(auxiliary[minDistanceIndex])
  // ?????????????????????????????????????????????????????????????????????????????????0
  if (intersectionArr.length === 0) {
    return 0
  }
  // ??????????????????????????????????????????????????????????????????
  if (intersectionArr.length === 1) {
    // ?????????????????????????????????10??????????????????????????????????????????????????????????????????
    for(let i = 1; i <= 10; i++) {
      let nextIndex = minDistanceIndex + i;
      // let prevIndex = minDistanceIndex - i;
      // if (!auxiliary[nextIndex]) {
        // intersectionArr.push(auxiliary[prevIndex])
      // } else {
        intersectionArr.push(auxiliary[nextIndex])
      // }
    }

    for(let i = 1; i <= 10; i++) {
      let prevIndex = minDistanceIndex - i;
      intersectionArr.push(auxiliary[prevIndex])
    }
  }
  // console.log('intersectionArr', intersectionArr)
  const angleArr = [];
  // ???intersectionArr ???????????????2?????????????????????2???????????????????????????????????????????????? X ????????????
  // ?????????intersectionArr????????????????????????????????????????????????pathname????????????????????????????????????
  // ??????selectArray??????????????????pathname?????????????????????angleArr
  // for(let i = 0; i < intersectionArr.length - 1; i++) {
  //   const point1 = intersectionArr[0]
  //   const point2 = intersectionArr[i + 1]
  //   // console.log('point1-point2', point1, point2)
  //   let angle = 0;
  //   if(i <= 11) {
  //     angle = Math.atan2((point2[1] - point1[1]), (point2[0] - point1[0]))
  //   } else {
  //     angle = Math.atan2((point1[1] - point2[1]), (point1[0] - point2[0]))
  //   }
  //   angle = angle * (180 / Math.PI)
  //   angleArr.push(angle);
  // }

  for(let i = 0; i < selectArray.length - 1; i++) {
    const point1 = selectArray[i]
    const point2 = selectArray[i + 1]
    let angle = 0;
    if(i <= 11) {
      angle = Math.atan2((point2[1] - point1[1]), (point2[0] - point1[0]))
    } else {
      angle = Math.atan2((point1[1] - point2[1]), (point1[0] - point2[0]))
    }
    angle = angle * (180 / Math.PI)
    angleArr.push(angle);
  }
  const len = angleArr.length;
  // ??????????????????????????????90??????????????????????????????
  for(let i = 1;i < len; i++) {
    const current = angleArr[i];
    const previous = angleArr[(i+len-1)%len];
    if(Math.abs(previous - current) > 90) {
      if(angleArr[i] < 0) {
        angleArr[i] = 180 + angleArr[i];
      } else {
        angleArr[i] = 180 - angleArr[i];
      }
    }
  }
  return judgeAngle(angleArr);
}

// ???????????????????????????????????????
// ???intersectionArr?????????????????????????????????????????????????????????????????????
// ?????????????????????????????????2???????????????2??????????????????????????????????????????
// ??????????????????????????????????????????????????????????????????????????????????????????
const judgeAngle = (arr) => {
  const compareAngle = [];
  arr.reduce((acc, cur, index, arr) => {
    compareAngle.push(Math.abs(cur - arr[index - 1]));
  })
  const compareSort = quickSort(compareAngle);
  const compareAngLength = compareSort.length;
  compareSort.splice(0, 2);
  compareSort.splice(compareSort.length - 2, 2);
  const sumArr = compareSort.reduce((acc, cur) => Math.abs(acc) + Math.abs(cur));
  const avg = sumArr / compareAngLength;
  // const index = compareAngle.findIndex(val => Math.abs(val) < avg * 10);
  let index = Math.floor(compareAngle.length / 2);
  for(let i = 0; i < compareAngle.length; i++) {
    if(Math.abs(compareAngle?.[index + i]) < avg * 10 ) {
      index = index + i;
      break;
    }
    if(Math.abs(compareAngle?.[index - i]) < avg * 10 ) {
      index = index + i;
      break;
    }
  }
  return arr[index + 1];
}

const quickSort = (arr) => {
  if(arr.length <= 1) return arr;
  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr.splice(pivotIndex, 1)[0];
  const leftArr = [];
  const rightArr = [];
  for(let i = 0; i < arr.length; i++) {
    if(arr[i] < pivot) {
      leftArr.push(arr[i]);
    } else {
      rightArr.push(arr[i]);
    }
  }
  return quickSort(leftArr).concat([pivot], quickSort(rightArr));
}

// ????????????????????????????????????d= 0.012302029034879378 / 2?????????????????????????????????
// ???????????? r=  0.006151014517439689 (d?????????0.0123/2 )
// ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// ??????????????????????????????????????????????????????
export const getVehicleDefaultAngle = (centerCoord, auxiliary, originAuxiliary) => {
  // console.log('??????', centerCoord)
  let angleArr = []
  let angle = 0
  for (let i = 0; i < centerCoord.length; i++) {
    if (Array.isArray(centerCoord[i])) {
      let angle = calculationAngle(centerCoord[i], auxiliary, originAuxiliary)
      angleArr.push(angle)
    } else {
      angle = calculationAngle(centerCoord, auxiliary, originAuxiliary)
      break
    }
  }
  if (Array.isArray(centerCoord[0])) {
    return angleArr
  }
  return angle
}

const getEditHandleTypeFromEitherLayer = (handleOrFeature) => {
  if (handleOrFeature.__source) {
    return handleOrFeature.__source.object.properties.editHandleType;
  } else if (handleOrFeature.sourceFeature) {
    return handleOrFeature.sourceFeature.feature.properties.editHandleType;
  } else if (handleOrFeature.properties) {
    return handleOrFeature.properties.editHandleType;
  }

  return handleOrFeature.type;
}

export const getEditHandleColor = (handle) => {
  handle = !handle ? {} : handle

  switch (getEditHandleTypeFromEitherLayer(handle)) {
    case 'existing':
      if (handle.properties && (handle.properties.featureIndex === 1 || handle.properties.featureIndex === 0)) {
        return [0xff, 0x80, 0x00, 0]; // 0xff -> 0
      }
      return [0xff, 0x80, 0x00, 0xff];

    case 'snap-source':
      return [0xc0, 0x80, 0xf0, 0xff];
    case 'intermediate':
    default:
      return [0xff, 0xc0, 0x80, 0xff];
  }
}


export const getAllLineStringId = (obj) => {
  let arr = []
  if (obj?.features?.length && Array.isArray(obj.features)) {
    obj.features.map((item, index) => {
      if (item.geometry.type === 'LineString') {
        arr.push(index)
      }
    })
    return arr
  }
  return []
}

export const getEditScenesData = () => {
  let data = window.sessionStorage.getItem('editInfo')
  if (data) {
    data = JSON.parse(data)
    return data
  }
  return null
}
export const getQueryString = (name) => {
  let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i")
  let r = window.location.search.substr(1).match(reg)
  if (r != null) return unescape(r[2]); return null;
}

export const isEdited = () => {
  const editId = getQueryString('id')
  const isCopy = getQueryString('type')
  if (editId && !isCopy) {
    return true
  }
  if (editId && isCopy) {
    return false
  }
  return false
}

