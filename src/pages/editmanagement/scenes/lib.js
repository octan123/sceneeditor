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
  // 固定zoom = 10
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
// 测试使用
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
  
  // 测试使用
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
    // 高精地图图层
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

    // 测试使用
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

// 当前testFeatures 中是否有主车，且主车是第一个绘制的（即主车id：0）
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
    message.warning('主车不存在，或主车没有在第一步绘制')
    return
  }
  if (!scenesName) {
    message.warning('名称不能为空')
    return
  }
  if (testFeatures.features.length >= 2) {
    await screenshotCallback()
  }
  // 阻塞550毫秒，等待截屏产生
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
    message.success(`${isEdited ? `修改场景成功` : `创建场景成功`}`, 1.5, () => {
      window.location.href = `/sceneslist`
    })
    setIsCreating2(false)
  }


  // 勿删，老版创建任务代码
  // let msg = 'Loading...'
  // const taskName = `弯道超车-${new Date().getMonth() + 1}-${new Date().getDate()
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
  //     message.success({ content: `创建【${taskName}】任务成功`, key: 'createTask', duration: 2, style: { marginTop: '40vh' } })
  //     console.log(response);
  //   })
  //   .catch(function (error) {
  //     message.error({ content: `创建【${taskName}】任务失败`, key: 'createTask', duration: 2, style: { marginTop: '40vh' } })
  //     console.log(error);
  //   }).then(function () {
  //     // always executed
  //     setIsCreating(false)
  //   })
}

export const createLocalTask = async ({ mapId, testFeatures }, setIsCreating, screenshotCallback) => {
  if (!hasMainVehicle(testFeatures)) {
    message.warning('主车不存在，或主车没有在第一步绘制')
    return
  }

  if (testFeatures.features.length >= 2) {
    screenshotCallback()
  }
  // 阻塞550毫秒，等待截屏产生
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
      message.success({ content: '本地仿真任务生成成功!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
      window.location.href = '/task/local'
    }).catch((err) => {
      console.log('set_err', err);
      setIsCreating(false);
      message.error({ content: '本地仿真任务生成失败!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
    })
  }).catch((err) => {
    console.log('get_err', err);
    setIsCreating(false);
    message.error({ content: '本地仿真任务生成失败!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
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
  //   message.success({ content: '本地仿真任务生成成功!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
  //   setIsCreating(false);
  //   window.location.href = '/task/local';
  // }).catch(e => {
  //   console.log('localStaskError', e);
  //   message.error({ content: '本地仿真任务生成失败!', key: 'createTask', duration: 2, style: { marginTop: '40vh' } });
  //   setIsCreating(false);
  // });
}

// 绘制完障碍车路线之后，默认给当前路线（DrawLineString） 绑定一个同色的 trigger
export const createCurrentLineTrigger = (data, zoom, index) => {
  const toNumber = n => {
    return n
  }
  const featuresArr = data.features
  let lastMode
  if (featuresArr && featuresArr.length) {
    // 取得当前绘制模式情况下，数组中最后一个元素
    lastMode = featuresArr[featuresArr.length - 1]
  }
  if (lastMode.geometry && lastMode.geometry.type === 'LineString') {
    const lineStartPosition = lastMode.geometry.coordinates[0]
    // 默认线条的起点为触发器的中心点，默认触发器的左边+-150, 30/10*当前zomm
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

// 到达下一个点的加速度
const getAcceleration = (s, v, t) => {
  if (t <= 0) {
    return 0
  }
  let a = 2 * (s - v * t)
  a = a / Math.pow(t, 2)
  console.log('每次的加速度为', a)
  return a
}

// 根据加速度，求下一个点的熟读
// s 路程， v 上一个点的速度， t 下一个点的时间和上一个点的差值
export const getNextSpeed = (s, v, t) => {
  console.log('上一个点的速度：', v)
  const a = getAcceleration(s, v, t)
  const speed = v + a * t
  console.log('当前点的速度为', speed)
  return speed
}

// t = 2s / v1 + v2
export const getNextTime = (s, v1, v2) => {
  let time = 2 * s / (Number(v1) + Number(v2))
  console.log('当前点的时间为', time)
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

// 获取每个点之间螺旋曲线的距离
export const getBezierDistance = (arr) => {
  let newArr = []
  arr.map(item => {
    let s = 0
    item.map((item2, index2) => {
      let x
      let y
      let _s
      if (index2 < item.length - 1) {
        // 前者减去后者，绝对值
        x = Math.abs(item[index2].x - item[index2 + 1].x)
        y = Math.abs(item[index2].y - item[index2 + 1].y)
        // 开平方相加
        x = Math.pow(x, 2)
        x = Math.pow(y, 2)
        // 开根号
        _s = Math.sqrt(x + y)
        s += _s
      }
    })
    newArr.push(s)
  })
  return newArr
}

export const getAuxiliaryArr = (data) => {
  // 转一维数组
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
    //   // console.log('圆心到点的距离',getTwoPointDistance(centerCoord,item))
    //   intersectionArr.push(item)
    //   intersectionArrIndex.push(index)
    // }

    // 每个路径点和当前车点的距离
    if (getTwoPointDistance(centerCoord, item)) {
      distanceArr.push(getTwoPointDistance(centerCoord, item))
    }
  })
  originAuxiliary.map(val => {
    val.path.map(item => {
      pathNameArr.push(val.name)
    })
  })
  // 取得最小值。
  let minDistance = Math.min(...distanceArr)
  let minDistanceIndex = distanceArr.indexOf(minDistance)
  const pathName = pathNameArr[minDistanceIndex];
  let tag = false;
  let originAuxIndex = 0;
  let selectArray = [];
  originAuxiliary.map(val => {
    if(val.name === pathName) {
      // 在同一个pathName中，如果存在，则从同一个pathArray中取出math.min(arr.length, 20);
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
  // 当前主车点，没有与之相交的轨迹线点，没法判断方向。默认0
  if (intersectionArr.length === 0) {
    return 0
  }
  // 只有一个相交点，取当前相交点，数组的后一个点
  if (intersectionArr.length === 1) {
    // 前后一个点，修改为前后10点，用于处理地图数据不准确导致的角度计算错误
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
  // 取intersectionArr 数组中任意2点，默认取前面2个点，组成一条直线，求这条直线和 X 轴的角度
  // 原有的intersectionArr是降维的数组，获取的数据可能是跨pathname，进而导致角度计算错误，
  // 采用selectArray，只取同一个pathname中的数据来计算angleArr
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
  // 前后角度差值不能超过90度，否则进行角度转换
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

// 对角度进行判断，返回合理值
// 取intersectionArr数据中的两点，计算角度，连续的角度再两两相减，
// 剔除角度差数组中的最大2个值和最小2个值，求剩余角度差的平均值，
// 返回第一个符合角度差小于两倍平均值的索引，进而获得合理的角度
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

// 以主车点为圆心，默认直径d= 0.012302029034879378 / 2（道路虚线之间的宽度）
// 默认半径 r=  0.006151014517439689 (d约等于0.0123/2 )
// 判断车辆轨迹线所有点集合数组中，哪些点和圆心的距离小于半径（即点是否在圆内）
// 参数：圆心坐标，导入辅助线点集合数组
export const getVehicleDefaultAngle = (centerCoord, auxiliary, originAuxiliary) => {
  // console.log('圆心', centerCoord)
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

