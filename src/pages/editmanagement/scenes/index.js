import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Layout, Radio, Button, Spin, Tabs, message, Input } from 'antd'
import Icon from '@ant-design/icons';
import { connect } from 'react-redux'

import {
  EditableGeoJsonLayer,
  ModifyMode, ViewMode, TransformMode,
  DrawPointMode, DrawLineStringMode,
  DrawRectangleMode, MeasureDistanceMode,
} from 'nebula.gl'
import DeckGL from '@deck.gl/react'
import { PathLayer, IconLayer } from '@deck.gl/layers'


import { OrthographicView } from '@deck.gl/core'
import _, { set } from 'lodash'
import {
  getBezier,
  getMapList,
  getMapData,
  getMapDataFunc,
  transOdrmapToLayers,
  getOdrmapBounds,
  fitBounndsForOdrmap,
  getDeckColorForFeature,
  createCurrentLineTrigger,
  getFeaturesTypeArr,
  getBezierDistance,
  POSITION_RATE,
  getEditHandleColor,
  getIconScale,
  getAuxiliaryArr,
  getOriginAuxiliary,
  createLocalTask,
  getVehicleDefaultAngle,
  getAllLineStringId,
  getEditScenesData,
  isEdited,
  getQueryString,
  getMapCenter,
} from './lib'


import VehicleForm from './components/vehicle'
import CreateArrow from './components/createEditArrow'
import CreateScenesContent from './components/createScenesContent'
import RenderObstacleInfo from './components/renderObstacleInfo'
import CarModal from './components/infoModal'
import { ANTD_RADIO_STYLE, EMPTY_FEATURE_COLLECTION } from './consts'
import './style.less'
import { get } from 'lodash'


import VehicleImg from './imgs/vehicle2.png'
import CarImg2 from './imgs/obstacle3.png'
import CarImg3 from './imgs/obstacle3_noArrow.png';

const { TabPane } = Tabs;
const { Content } = Layout

const VIEW_MODE = new ViewMode()
const MODIFY_MODE = new ModifyMode()

const TRIGGER_MODE = new DrawRectangleMode()
const CAR_MODE = new DrawPointMode()
const TRANSFORM_MODE = new TransformMode()
const ROUTE_MODE = new DrawLineStringMode()
const MEASUREDIS_MODE = new MeasureDistanceMode();


const ALTER_MODE = [MODIFY_MODE, TRANSFORM_MODE]
const mapView = new OrthographicView({
  id: 'mainmap',
  flipY: false
})

let timer
const ScenesEditPage = (props) => {
  const [editHandleType, setEditHandleType] = useState('icon')
  const [CarImage, setCarImage] = useState(CarImg3)
  const [mapId, setMapId] = useState('18')
  const [editMode, setEditMode] = useState(CAR_MODE)
  const [viewState, setViewState] = useState({
    target: [0, 0],
    rotationX: 0,
    rotationOrbit: 0,
    maxZoom: 15,
    minZoom:7
  })
  const [layers, setLayers] = useState([])
  const [routeFeature, setRouteFeature] = useState([])
  const [testFeatures, setTestFeatures] = useState(EMPTY_FEATURE_COLLECTION)
  const [selectedFeatureIndexes, setSelectedFeatureIndexes] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [mapList, setMapList] = useState([{
    id: 18,
    name: 'outOP121501_map',
    url: '',
    xodr: '',
  }]);
  const [tabsKey, setTabsKey] = useState(4)
  const deckRef = useRef()
  // 默认地图的zoom是2
  const [mapZoom, setMapZoom] = useState(11)
  // 障碍车路线是否有绑定的trigger
  const [currentObCar, setCurrentObCar] = useState(0)
  const [isBindTrigger, setIsBindTrigger] = useState(true)
  const [isAddVehicle, setIsAddVehicle] = useState(false)
  const [obstacleData, setObstacleData] = useState([])
  const [distanceList, setDistanceList] = useState([])

  // 点击汽车icon显示旋转手柄
  const [editIconVisible, setEditIconVisible] = useState(false)
  const [editIconInfo, setEditIconInfo] = useState({})
  // 主车两个点的映射icon
  const [iconLayerData, setIconLayerData] = useState([])

  // 存放道路辅助线的数组
  const [auxiliary, setAuxiliary] = useState([])
  // 原始辅助线数组，auxiliary数组存储的是二维降一维后的结果
  const [originAuxiliary, setOriginAuxiliary] = useState([]);
  const [isScreenshot, setIsScreenshot] = useState(false)
  const [screenshotClone, setScreenshotClone] = useState([])
  // 截图获取的图片存放在变量screensHotImage
  // const [screensHotImage, setScreensHotImage] = useState('')
  // const screensHotRef = useRef()

  
  const [carModalStyle, setCarModalStyle] = useState({})
  const [infoVisible, setInfoVisible] = useState(false)
  const [carIndex,setCarIndex]= useState(0)

  const [coordinateX, setCoordinateX] = useState(0);
  const [coordinateY, setCoordinateY] = useState(0);
  const [uploadMapData, setUploadMapData] = useState({})

  const initFeatures = () => {
    if (isEdited() || getQueryString('type')) {
      let editData = getEditScenesData()
      if (editData) {
        console.log('editData.data', editData.data);
        setTestFeatures(editData.data)
        let newIconData = []
        let lastLineString = 2
        
        editData.data.features.map((item,index) => {
          if (index === 0 || index === 1) {
            newIconData.push({
              coordinates: item.geometry.coordinates,
              angle: item.properties.headings,
              color: [255, 0, 0]
            })
          }
          if ( index > 1) {
            if (item.geometry.type === 'LineString') {
              const obstaclesData = getFeaturesTypeArr(editData.data, 'Polygon')
              setObstacleData(obstaclesData)
              let fea = item
              renderRoute(fea, obstaclesData)
              lastLineString = index
            }
          }
        })
        setIconLayerData(newIconData)
        setTimeout(() => {
          if (  editData.data.features.length > 2) {
            setEditMode(MODIFY_MODE)
            // setEditHandleType('icon')
            setSelectedFeatureIndexes([lastLineString])
          } else {
            setEditMode(VIEW_MODE)
            setEditHandleType('point')
          }
          
        }, 50)
        const newViewState = getMapCenter(
          editData.data.features[0].geometry.coordinates,
          editData.data.features[1].geometry.coordinates
        )
        setViewState({
          ...viewState,
          ...newViewState
        })
        setMapZoom(9.5)
      }
    } else {
      // nothing
    }
  }
  useEffect(() => {
    async function init() {
      let editData = getEditScenesData()
      if ((isEdited() && editData) || getQueryString('type')) {
        setMapId(editData.mapId)
      } else {
        setMapId(18)
      }
      setTimeout(()=> {
        initFeatures()
      },500)
    }
    init()
  }, [])
  const [tempMapData, setTempMapData]= useState({})
  useEffect(() => {
    async function initMapData() {
      if (!mapId) return
      let filePath
      
      let mapData
      if (uploadMapData.Roads){
        mapData = getMapDataFunc({data:uploadMapData})
      }else {
        filePath =  '';//mapList.find(item => item.id === mapId).url
        mapData = await getMapData({ filePath })
      }
      setTempMapData(mapData)
      const auxiliaryArr = getAuxiliaryArr(mapData)
      const originAuxiliary = getOriginAuxiliary(mapData);
      const layers = transOdrmapToLayers(mapData)
      const bounds = getOdrmapBounds(mapData)
      const mapSize = _.pick(deckRef.current.deck, ['width', 'height'])
      const newViewState = fitBounndsForOdrmap({
        ...mapSize,
        bounds,
        padding: 50
      })
      setLayers(layers)
      setAuxiliary(auxiliaryArr)
      setOriginAuxiliary(originAuxiliary);
      setViewState({
        ...viewState,
        ...newViewState
      })
    }

    initMapData()
  }, [mapId,uploadMapData])

  useEffect(() => {
    const layers = transOdrmapToLayers(tempMapData,mapZoom)
    setLayers(layers)
  }, [mapZoom])
  // 截屏前的回调
  const screenshotCallback = () => {
    setViewState({
      ...viewState,
      target: [0, 0],
      zoom: 7.5
    })
    setMapZoom(8)
    setEditHandleType('icon')
    setTimeout(() => {
      setEditMode(MODIFY_MODE)
    }, 50)
    const indexsArr = getAllLineStringId(testFeatures)
    setSelectedFeatureIndexes([...indexsArr])
    setTimeout(() => {
      setIsScreenshot(true)
    }, 400)
  }

  const mapOnChange = e => {
    // 清除iconLayer图层
    setEditMode(CAR_MODE)
    setEditIconVisible(false)
    setIconLayerData([])
    // 清除上一个地图的FeatureIndexes
    setTestFeatures(EMPTY_FEATURE_COLLECTION)
    setSelectedFeatureIndexes([])

    setUploadMapData({})
    setMapId(e.target.value)
  }

  const onEdit = ({ updatedData, editType, editContext }) => {
    let updatedSelectedFeatureIndexes = selectedFeatureIndexes;
    const newIconData = JSON.parse(JSON.stringify(iconLayerData))
    // TODO,updatedSelectedFeatureIndexes 可能是多个feature, 目前都是一个
    const currentFeatureIndex = updatedSelectedFeatureIndexes[0];
    if (!['movePosition', 'extruding', 'rotating', 'translating', 'scaling'].includes(editType)) {
      // console.log(editType, updatedData);    
    }
    if (editType === 'removePosition') {
      return;
    }

    if (['addTentativePosition', 'updateTentativeFeature'].includes(editType)) {
      updatedSelectedFeatureIndexes = []
      return
    }
    let newUpdatedData
    if (editType === 'addFeature') {
      const { featureIndexes } = editContext;
      // Add the new feature to the selection
      const fea = updatedData.features[featureIndexes[0]]
      fea.properties.id = featureIndexes[0]
      if (fea.geometry.type === 'LineString') {
        setCarImage(CarImg2);
        let defaultHeadings = getVehicleDefaultAngle(fea.geometry.coordinates, auxiliary, originAuxiliary)
        if (updatedData.features.length <= 2) {
          message.warning("请先绘制主车路径")
          return false
        }
        if (isBindTrigger) {
          // setpPrevTriggerId(featureIndexes[0] + 1)
          fea.bindTriggerId = featureIndexes[0] + 1
          newUpdatedData = createCurrentLineTrigger(updatedData, mapZoom, featureIndexes[0] + 1)
        }
        if (isAddVehicle) {
          fea.bindTriggerId = Number(currentObCar)
        }
        const obstaclesData = getFeaturesTypeArr((newUpdatedData ? newUpdatedData : updatedData), 'Polygon')
        setObstacleData(obstaclesData)
        // const pointsLen = fea.geometry.coordinates.length
        // fea.properties.headings = new Array(pointsLen).fill(0)
        fea.properties.headings = defaultHeadings
        fea.properties.velocity=[]
        fea.properties.time=[]
        renderRoute(fea, obstaclesData)
        setTimeout(() => {
          setEditMode(MODIFY_MODE)
          setSelectedFeatureIndexes(featureIndexes)
        }, 50)
      }
      if (fea.geometry.type === 'Point') {
        let defaultHeadings = getVehicleDefaultAngle(fea.geometry.coordinates, auxiliary, originAuxiliary)
        fea.properties.headings = defaultHeadings
        let tempIconLayData = {
          coordinates: fea.geometry.coordinates,
          angle: defaultHeadings,
          color: [255, 0, 0]
        }

        // 只画2个点
        if (newIconData.length < 2) {
          newIconData.push(tempIconLayData)
          setIconLayerData(newIconData)
          if (newIconData.length === 2) {
            setEditMode(VIEW_MODE)
          }
        } else {
          // 主车2个不可见的点绘制完成，且映射的icon也已经绘制完成
          // 还绘制主车路径点，则不写入
          updatedData.features.splice(featureIndexes[0], 1)
        }
      }
      updatedSelectedFeatureIndexes = [...featureIndexes]
    }
    if (editType === 'finishMovePosition' && currentFeatureIndex > 1) {
      // newUpdatedData = createCurrentLineTrigger(updatedData)
      const { featureIndexes } = editContext
      const fea = updatedData.features[featureIndexes[0]]
      const obstaclesData = getFeaturesTypeArr((newUpdatedData ? newUpdatedData : updatedData), 'Polygon')
      renderRoute(fea, obstaclesData)
    }

    // 监听主车起点，终点移动 
    if (editType === 'movePosition' ) {
      setInfoVisible(false)
      if (iconLayerData.length === 2 && (currentFeatureIndex === 0 || currentFeatureIndex === 1)) {
        let tempIconLayData = JSON.parse(JSON.stringify(iconLayerData))
        tempIconLayData[currentFeatureIndex].coordinates = updatedData.features[currentFeatureIndex].geometry.coordinates
        setIconLayerData(tempIconLayData)
      }
    }
    console.log('newUpdatedData ? newUpdatedData : updatedData', newUpdatedData ? newUpdatedData : updatedData);
    console.log('updatedSelectedFeatureIndexes', updatedSelectedFeatureIndexes);
    setTestFeatures((newUpdatedData ? newUpdatedData : updatedData))
    setSelectedFeatureIndexes(updatedSelectedFeatureIndexes)
  }
  const getFillColor = (feature, isSelected) => {
    const index = testFeatures.features.indexOf(feature);
    return isSelected
      ? getDeckColorForFeature(index, 1.0, .8)
      : getDeckColorForFeature(index, (index === 0 || index === 1 ? 0.6 : 0.5), .8);
  }
  const getLineColor = (feature, isSelected) => {
    let index
    let polygonIndex
    if (feature.geometry.type === 'Polygon') {
      polygonIndex = testFeatures.features.indexOf(feature) // 1
    }
    obstacleData.map((item, idx) => {
      if (Number(item.bindTriggerId) === feature.bindTriggerId) {
        index = idx
      }
      if (Number(item.bindTriggerId) === polygonIndex && feature.geometry.type === 'Polygon') {
        index = idx
      }
    })
    if (!index) {
      index = 0
    }
    return isSelected
      ? getDeckColorForFeature(index, 1, 0.3)
      : getDeckColorForFeature(index, (index === 0 || index === 1 ? 0.6 : 1), 0.3);
  }

  const onLayerClick = (info, event) => {
    console.log(info, event)
    let featureIndex = !info.isGuide ? info.index : info.object.properties.featureIndex
    if (info.index === -1) {
      setEditIconVisible(false)
      setInfoVisible(false)
      return
    }
    
    if (info && info.index !== -1) {
      featureIndex > 1 && setCarIndex(info.index)
      if (ALTER_MODE.includes(editMode) || editMode === VIEW_MODE || true) {
        // 主车起点，终点被触发点击
        if (event.srcEvent.ctrlKey) {

          const _info = info
          if (featureIndex < 2) {
            info.index = featureIndex
          }
          _info.eventInfo = event
          info.isGuide = featureIndex > 1 ? true : false
          info.featureIndex = featureIndex
          editIconVisible && setEditIconVisible(false)
          setEditIconInfo(info)
          setTimeout(() => {
            setEditIconVisible(true)
          }, 100)
        }
        setSelectedFeatureIndexes([featureIndex])
        if (!info.object.geometry) {
          setEditMode(VIEW_MODE)
          return
        }
        switch (info.object.geometry.type) {
          case 'LineString':
            break
          case 'Polygon':
            // 添加多个障碍车时，障碍车路径点击触发器时候触发
            if (editMode === ROUTE_MODE) {
              return
            }
            setEditHandleType('point')
            setEditMode(VIEW_MODE)
            setTimeout(() => {
              setEditMode(TRANSFORM_MODE)
            }, 50)
            break
          default:
            if (Number(tabsKey) === 2 && featureIndex > 1) {
              setEditHandleType('icon')
              if (!event.srcEvent.ctrlKey) {
                setCarModalStyle({
                  top: event.offsetCenter.y,
                  left: event.offsetCenter.x,
                })
                setInfoVisible(false)
              }
              setEditMode(MODIFY_MODE)
              setTimeout(() => {
                event.srcEvent.ctrlKey ||setInfoVisible(true)
              }, 50)
              return
            }
            if (Number(tabsKey) === 4 && featureIndex <= 1) {
              setEditHandleType('point')
              setEditMode(MODIFY_MODE)
              // setTimeout(() => {
              //   setEditMode(MODIFY_MODE)
              // }, 50)
              return
            }
            setEditHandleType('point')
            setEditMode(MODIFY_MODE)
            break
        }
      }
    } else {
      setSelectedFeatureIndexes([])
    }
  }

  const onViewStateChange = useCallback(({ viewState }) => {
    setEditIconVisible(false)
    setInfoVisible(false)
    setMapZoom(viewState.zoom)
    setViewState(viewState)
  }, [])

  const getTooltip = info => {
    const [x, y] = info.coordinate || []
    setCoordinateX(x ? Number.parseFloat(x).toFixed(6): 0);
    setCoordinateY(y ? Number.parseFloat(y).toFixed(6): 0);
    const obj = info.object
    return obj && `x: ${x}
        y: ${y}`
  }
  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 200, height: 99, mask: false, }
  };

  

  const iconLayers = new IconLayer({
    id: 'icon-layer',
    pickable: true,
    data: iconLayerData,
    iconAtlas: VehicleImg,
    iconMapping: ICON_MAPPING,
    getIcon: d => 'marker',
    sizeUnits: 'pixels',
    sizeScale: getIconScale(mapZoom) * 1.5,
    getPosition: d => d.coordinates,
    getSize: d => 5,
    getColor: d => [20, 121, 215],
    getAngle: d => d.angle,
  });

  const editableGeoJsonLayer = new EditableGeoJsonLayer({
    id: 'geojson',
    data: testFeatures,
    selectedFeatureIndexes: selectedFeatureIndexes,
    mode: editMode,
    modeConfig: { ...viewState },
    autoHighlight: false,
    onEdit: onEdit,
    editHandleType: editHandleType,
    // test using icons for edit handles
    // editHandleIconAtlas: CarImg2,
    editHandleIconAtlas: CarImage,
    editHandleIconMapping: {
      existing: {
        x: 0,
        y: 0,
        width: 140,
        height: 60,
        mask: false,
      },
    },
    // getEditHandleIcon: d => 'marker',
    getEditHandleIconSize: getIconScale(mapZoom) * 5,
    getEditHandleIconAngle: d => {
      const featureIndex = d.properties.featureIndex
      const posIndex = d.properties.positionIndexes
      if (featureIndex >= 0) {
        const feature = testFeatures.features[featureIndex]
        return get(feature, `properties.headings.${posIndex}`, 0)
      }
      return 0
    },
    getEditHandlePointColor: getEditHandleColor,

    // Specify the same GeoJsonLayer props
    lineWidthMinPixels: 1,
    pointRadiusMinPixels: 2,
    pointRadiusMaxPixels: 5,
    // Accessors receive an isSelected argument
    getFillColor: getFillColor,
    getLineColor: getLineColor,

    // Can customize editing points props
    editHandlePointRadiusScale: 1,
  })



  const onEditToolChange = activeKey => {
    setInfoVisible(false)
    const activeKeyMap = {
      '2': ROUTE_MODE,
      '3': TRIGGER_MODE,
      '4': CAR_MODE,
      '5': VIEW_MODE
    }
    setTabsKey(activeKey)
    const value = activeKeyMap[activeKey]
    setSelectedFeatureIndexes([])
    if (Number(activeKey) === 4) {
      setEditHandleType('point')
      if (iconLayerData.length === 2) {
        setEditMode(MODIFY_MODE)
      } else {
        setEditMode(CAR_MODE)
      }
    } else if (Number(activeKey) === 2) {
      setEditHandleType('icon')
      setTimeout(() => {
        setEditMode(ROUTE_MODE)
      }, 100)
    } else if (Number(activeKey) === 5) {
      setEditMode(VIEW_MODE)
    }
  }

  const renderRoute = async (feature, data2) => {
    let colorIndex = 0

    data2.map((item, idx) => {
      if (item.bindTriggerId == feature.bindTriggerId) {
        colorIndex = idx
      }
    })

    let { points } = await getBezier(feature)
    let distanceArr
    if (points.length && Array.isArray(points[0])) {
      distanceArr = getBezierDistance(points)
      // 2维数组先转1维
      points = points.reduce((a, b) => { return a.concat(b) })
    }
    if (distanceArr) {
      setDistanceList(distanceArr)
    }
    const route = routeFeature.find(route => route.id === feature.properties.id)
    if (route) {
      route.path = points.map(d => [d.x / POSITION_RATE, d.y / POSITION_RATE])
    } else {
      routeFeature.push({
        id: feature.properties.id,
        colorIndex,
        path: points.map(d => [d.x / POSITION_RATE, d.y / POSITION_RATE])
      })
    }
    setRouteFeature([...routeFeature])
  }

  const routeLayer = new PathLayer({
    id: 'route-layer',
    data: routeFeature,
    widthUnits: 'pixels',
    rounded: true,
    opacity: 0.8,
    getWidth: d => 3,
    getColor: d => getDeckColorForFeature(d.colorIndex, 1.0, 1.0),
    getPath: d => d.path
  })

  // 拖拽工具栏begin
  const [isVResize, setIsVResize] = useState(false)
  const [vNum, setVNum] = useState(400)
  const [vNumLimit, setVNumLimit] = useState(30)
  const [containerwidth, setContainerwidth] = useState(0)
  const [resizeOffsetInfo, setResizeOffsetInfo] = useState({
    clientTop: 0,
    clientLeft: 0
  })
  useEffect(() => {
    setTimeout(() => {
      initResizeInfo()
    }, 100)
    const throttled = _.throttle(() => {
      setEditIconVisible(false)
      initResizeInfo()
    }, 200)
    window.onresize = throttled
    return () => window.onresize = null
  }, [])
  useEffect(() => {
    setEditIconVisible(false)
  }, [props.adsiderCollapsed])
  const getEleOffset = (ele) => {
    var clientTop = ele.offsetTop
    var clientLeft = ele.offsetLeft
    let current = ele.offsetParent
    while (current !== null) {
      clientTop += current.offsetTop
      clientLeft += current.offsetLeft
      current = current.offsetParent
    }
    return {
      clientTop,
      clientLeft,
      height: ele.offsetHeight,
      width: ele.offsetWidth
    }
  }
  // 初始化resize信息
  const initResizeInfo = () => {
    const hEle = document.getElementById('h_resize_container')
    const newResizeOffsetInfo = getEleOffset(hEle)
    setResizeOffsetInfo(newResizeOffsetInfo)
    setContainerwidth(document.getElementById('v_resize_container').offsetWidth)
    if (hEle.offsetWidth - vNum < vNumLimit) {
      setVNum(hEle.offsetWidth - vNumLimit)
    }
  }

  // 水平拖动
  const vResizeover = (e) => {
    if (isVResize && vNum >= vNumLimit && (containerwidth - vNum >= vNumLimit)) {
      let newvalue = containerwidth - e.clientX + resizeOffsetInfo.clientLeft
      if (newvalue < vNumLimit) {
        newvalue = vNumLimit
      }
      if (newvalue > containerwidth - vNumLimit) {
        newvalue = newvalue
      }
      setVNum(newvalue)
    }
  }
  const stopResize = () => {
    setIsVResize(false)
  }
  // 拖拽工具栏end

  const onValuesChangeVehicle = (changedValues, allValues) => {
    const tempTestFeaturesTemp = JSON.parse(JSON.stringify(testFeatures))
    const updateIconLayerData = JSON.parse(JSON.stringify(iconLayerData))
    // headings-0:30, headings-2: 25  借用key值简单判断
    if (JSON.stringify(changedValues).indexOf('headings-0') > -1) {
      updateIconLayerData[0].angle = changedValues['headings-0']
      tempTestFeaturesTemp.features[0].properties.headings = [changedValues['headings-0']]
    }
    if (JSON.stringify(changedValues).indexOf('headings-1') > -1) {
      updateIconLayerData[1].angle = changedValues['headings-1']
      tempTestFeaturesTemp.features[1].properties.headings = [changedValues['headings-1']]
    }

    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      setIconLayerData(updateIconLayerData)
      setTestFeatures(tempTestFeaturesTemp)
    }, 100)
  }

  const getEditIconAngle = (angle, index, isGuide, lineStringIndex) => {
    if (!isGuide) {
      const tempIconLayerData = JSON.parse(JSON.stringify(iconLayerData))
      tempIconLayerData[index].angle = angle
      setIconLayerData(tempIconLayerData)
    }
    const tempTestFeaturesTemp = JSON.parse(JSON.stringify(testFeatures))
    let fea
    if (!isGuide) {
      tempTestFeaturesTemp.features[index].properties.headings = [angle]
    } else {
      tempTestFeaturesTemp.features[lineStringIndex].properties.headings[index] = angle
      fea = tempTestFeaturesTemp.features[lineStringIndex]
    }
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      setTestFeatures(tempTestFeaturesTemp)
      if (lineStringIndex > 1 && isGuide) {
        const obstaclesData = getFeaturesTypeArr(testFeatures, 'Polygon')
        renderRoute(fea, obstaclesData)
      }
    }, 50)
  }

  const changeMeasureDisMode = () => {
    setEditMode(MEASUREDIS_MODE);
    setViewState({
      ...viewState,
      measurementCallback: ((e) => {
        console.log('measurementCallback', e);
      })
    })
  }

  return (
    <Layout className="full-container scenes-edit-page">
      <Content className="map-container"
        onMouseMove={vResizeover}
        onMouseUp={stopResize} onMouseLeave={stopResize}
        id="v_resize_container"
      >
        <div className="map-box" id="h_resize_container">
          {editIconVisible ? <CreateArrow
            {...editIconInfo}
            getEditIconAngle={getEditIconAngle}
            iconLayerData={iconLayerData}
            testFeatures={testFeatures}
            zoom={mapZoom}
          /> : null}
          <DeckGL
            onAfterRender={(e) => {
              if (isScreenshot) {
                const pUrl = e.gl.canvas.toDataURL()
                // setScreensHotImage(pUrl)
                window.localStorage.setItem('localScreensHot', pUrl)
              }
              setIsScreenshot(false)
            }}
            ref={deckRef}
            views={mapView}
            controller={{
              doubleClickZoom: false,
            }}
            viewState={viewState}
            onViewStateChange={onViewStateChange}
            getTooltip={getTooltip}
            style={{
              background: 'rgba(255,255,255,1)'    
            }}
            // parameters={{
            //   clearColor: [50,50,50,1],
            // }}
            layers={[...layers, iconLayers, editableGeoJsonLayer, routeLayer]}
            onClick={onLayerClick}
            getCursor={editableGeoJsonLayer.getCursor.bind(editableGeoJsonLayer)}
          >
          </DeckGL>
          <div style={{ position: 'absolute', right: 0, display: 'flex', flexDirection: 'row' }}>
            {/* <Button onClick={changeMeasureDisMode} style={{ marginRight: 5, paddingBottom: 30 }} icon={<RulerIcon />} /> */}
            <div style={{ marginTop: 5 }}>X:</div>
            <Input style={{ width: 90 }} disabled value={coordinateX} />
            <div style={{ marginTop: 5 }}>Y:</div>
            <Input style={{ width: 90 }} disabled value={coordinateY} />
          </div>
          {infoVisible ?
            <CarModal
              // onValuesChange={(e) => { console.log(e) }}
              data={testFeatures}
              featureIndex={selectedFeatureIndexes}
              carIndex={carIndex}
              styleObj={carModalStyle}
              setTestFeatures={setTestFeatures}
              renderRoute={renderRoute}
              distanceList={distanceList}
            />
            : null}
        </div>
        <div className="can-h-resize" draggable={false} onMouseDown={() => setIsVResize(true)}></div>
        <div className="tool-box" style={{ width: vNum, paddingLeft: 10 }} onMouseOver={() => setInfoVisible(false)}>
          <Tabs
            className='cust-tabs'
            // tabBarExtraContent={tabOperations}
            onChange={onEditToolChange}
            defaultActiveKey={(isEdited() || getQueryString('type')) ? '4' : '1'}
          >
            <TabPane tab="选择地图" key="1" disabled={isEdited() || getQueryString('type')}>
              <Radio.Group value={mapId} onChange={mapOnChange}>
                {mapList ? mapList.map(item => (<Radio style={ANTD_RADIO_STYLE} key={item.id} value={item.id}>{item.name}</Radio>)) : <Spin />}
              </Radio.Group>
            </TabPane>
            <TabPane tab="主车路径" key="4" value={CAR_MODE}>
              {iconLayerData.length === 0 ? `请在地图上标记起点和终点` : null}
              <div style={{ color: '#1890ff' }}>{iconLayerData.length === 2 ? `单击主车拖动位置，Ctrl+单击图片调整方向` : null}</div>
              {iconLayerData.length === 2 ? <VehicleForm
                data={iconLayerData}
                onValuesChange={onValuesChangeVehicle}
              />
                : null}
            </TabPane>
            <TabPane tab="障碍车路径" key="2" value={ROUTE_MODE}>
              <RenderObstacleInfo
                props={{
                  setEditIconVisible,
                  testFeatures,
                  setTestFeatures,
                  setRouteFeature,
                  routeFeature,
                  setEditMode,
                  setCarImage,
                  setEditHandleType,
                  setSelectedFeatureIndexes,
                  setObstacleData,
                  setCurrentObCar,
                  setIsAddVehicle,
                  setIsBindTrigger,
                  iconLayerData,
                  obstacleData,
                  setIconLayerData,
                  renderRoute,
                  ROUTE_MODE,
                  VIEW_MODE,
                  MODIFY_MODE,
                  TRANSFORM_MODE,
                  distanceList,
                  setDistanceList
                }}
              />
            </TabPane>
            <TabPane tab="创建创景" key="5" value={VIEW_MODE}>
              <CreateScenesContent
                screenshotClone={screenshotClone}
                setIsScreenshot={setIsScreenshot}
                editData={
                 isEdited() ? getEditScenesData() : null
                }
                setViewState={setViewState}
                viewState={viewState}
                mapId={mapId}
                testFeatures={testFeatures}
                screenshotCallback={screenshotCallback}
              />
            </TabPane>
            {/* <TabPane tab="本地仿真" key="6" value={VIEW_MODE}>
              <Button
                type="primary"
                style={{ marginRight: 20 }}
                loading={isCreating}
                onClick={() => createLocalTask({ mapId, testFeatures }, setIsCreating, screenshotCallback)}
              >
                创建本地任务
              </Button>
            </TabPane> */}
          </Tabs>

        </div>
      </Content>
    </Layout>
  )
}

const mapStateToProps = state => {
  return {
    adsiderCollapsed: state.adsiderReducer.isCollapsed
  }
}

export default connect(
  mapStateToProps
)(ScenesEditPage)


