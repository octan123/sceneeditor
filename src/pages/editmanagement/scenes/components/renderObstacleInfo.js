import React, { useState, useRef } from 'react'
import { Button, Modal, } from 'antd'
import Draggable from 'react-draggable'
import {
  getFeaturesTypeArr,
} from '../lib'
import ObstacleForm from './obstacleForm'
import CarImg3 from '../imgs/obstacle3_noArrow.png';

// 渲染障碍物路线
const RenderObstacleInfo = (props) => {
  const {
    setEditIconVisible,
    testFeatures,
    setTestFeatures,
    setRouteFeature,
    routeFeature,
    setEditMode,
    setCarImage,
    setEditHandleType,
    setSelectedFeatureIndexes,
    obstacleData,
    setObstacleData,
    setCurrentObCar,
    setIsAddVehicle,
    setIsBindTrigger,
    renderRoute,
    ROUTE_MODE,
    VIEW_MODE,
    MODIFY_MODE,
    TRANSFORM_MODE,
    distanceList,
  } = props.props

  let timer
  const draggleRef = useRef();
  const [obstacleModalVisible, setObstacleModalVisible] = useState(false)
  const [obstacleCurrentData, setObstacleCurrentData] = useState([])
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 })
  const [dragIsDisabled, setDragIsDisabled] = useState(true)
  const getIndexFormId = (id, data) => {
    let _index
    data.map((item, index) => {
      if (item.properties.id == id) {
        _index = index
      }
    })
    return _index
  }
  // 删除某障碍车，曲线跟着删除
  const updatePathLayerData = id => {
    let index
    for (let i = 0; i < routeFeature.length; i++) {
      if (routeFeature[i].id === id) {
        index = i
        break
      }
    }
    routeFeature.splice(index, 1)
    setRouteFeature([...routeFeature])
  }
  const delCurrentObstacle = (id, type) => {
    setEditIconVisible(false)
    let testFeaturesTemp
    if (!type) {
      const features = [...testFeatures.features]
      const featuresTemp = [...testFeatures.features]
      let delIndex = getIndexFormId(id, features)
      const currentBindTriggerId = features[delIndex].bindTriggerId
      features.splice(delIndex, 1)
      featuresTemp.splice(delIndex, 1)
      let lstObstacleIndex
      let isLastObstacle = true
      featuresTemp.map(item => {
        // 触发器
        if (item.bindTriggerId == currentBindTriggerId) {
          isLastObstacle = false
        }
      })
      if (isLastObstacle) {
        featuresTemp.map((item, index) => {
          if (item.properties.id == currentBindTriggerId) {
            lstObstacleIndex = index
          }
        })
        features.splice(lstObstacleIndex, 1)
      }
      testFeaturesTemp = Object.assign({}, testFeatures, {
        features,
      });
    } else {
      // 删除触发器，则删除整个触发器依赖
      const features = [...testFeatures.features]
      const featuresTemp = [...testFeatures.features]
      features.splice(id, 1)
      featuresTemp.map((item, idx) => {
        if (item.bindTriggerId == id) {
          features.splice(idx, 1)
        }
      })
      testFeaturesTemp = Object.assign({}, testFeatures, {
        features,
      });
    }
    updatePathLayerData(id)
    setTestFeatures(testFeaturesTemp)
    const obstaclesData = getFeaturesTypeArr(testFeaturesTemp, 'Polygon')
    setObstacleData(obstaclesData)
    setEditMode(VIEW_MODE)
  }
  const editCurrentObstacle = (id, modeType) => {
    if (modeType === 'LineString') {
      setEditMode(VIEW_MODE)
      setEditHandleType('icon')
      // TODO 连续切换editHandleType 出现报错bug
      setTimeout(() => {
        setEditMode(MODIFY_MODE)
      }, 50)
    }
    if (modeType === 'Polygon') {
      setEditMode(VIEW_MODE)
      setEditHandleType('point')
      setTimeout(() => {
        setEditMode(TRANSFORM_MODE)
      }, 50)
    }
    setSelectedFeatureIndexes([Number(id)])
  }
  const addCurrentObstacle = (id) => {
    setEditMode(ROUTE_MODE)
    setEditHandleType('icon')
    setCurrentObCar(id)
    setIsAddVehicle(true)
    setIsBindTrigger(false)
  }
  const obstacleDetailModal = (id, e, modeType) => {
    editCurrentObstacle(id, modeType)
    const features = [...testFeatures.features]
    const arrIndex = getIndexFormId(id, features)
    setObstacleCurrentData(features[arrIndex])
    setObstacleModalVisible(true)
  }

  const onStart = (event, uiData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current.getBoundingClientRect();
    setBounds({
      left: -targetRect?.left + uiData?.x,
      right: clientWidth - (targetRect?.right - uiData?.x),
      top: -targetRect?.top + uiData?.y,
      bottom: clientHeight - (targetRect?.bottom - uiData?.y),
    },
    );
  };
  // 障碍车修改信息回调函数
  const onFinish = (values, isVisitity) => {
    const index = testFeatures.features.indexOf(obstacleCurrentData)
    let features = testFeatures.features
    const speedArr = []
    const headingsArr = []
    const timeArr = []
    for (let i in values) {
      if (i.indexOf('velocity') > -1) {
        speedArr.push(values[i])
      }
      if (i.indexOf('time') > -1) {
        timeArr.push(values[i])
      }
      if (i.indexOf('headings') > -1) {
        headingsArr.push(values[i])
      }
    }
    features[index].properties.velocity = speedArr
    features[index].properties.time = timeArr
    features[index].properties.headings = headingsArr
    const testFeaturesTemp = Object.assign({}, testFeatures, {
      features,
    });
    setTestFeatures(testFeaturesTemp)
    const obstaclesData = getFeaturesTypeArr(testFeatures, 'Polygon')
    renderRoute(features[index],obstaclesData)
    isVisitity || setObstacleModalVisible(false)
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  }

  const onValuesChange = (changedValues, allValues) => {
    console.log('onValuesChange',changedValues)
    if (JSON.stringify(changedValues).indexOf('headings') <= -1) {
      return
    }
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      onFinish(allValues, true)
    }, 500)
  }

  

  return (
    <>
      <Button type="primary" onClick={() => {
        setEditMode(ROUTE_MODE)
        setEditHandleType('icon')
        setIsAddVehicle(false)
        setIsBindTrigger(true)
        setCarImage(CarImg3)
      }}>添加新的障碍车/触发器</Button>
      <div style={{ color: '#1890ff' }}>{obstacleData.length > 0 ? `提示：单击拖动位置，Ctrl+单击调整方向` : null}</div>

      <div id="modalParent">
        <ul className="trigger-list">
          {obstacleData.length > 0 && obstacleData.map((item, index) => {
            return <li key={`obstacle-${index}`}>
              <div className="parent">
                触发器(id:{item.bindTriggerId})
            <Button size="small" onClick={() => editCurrentObstacle(item.bindTriggerId, 'Polygon')}>编辑</Button>
                <Button size="small" onClick={() => delCurrentObstacle(item.bindTriggerId, 'trigger')}>删除</Button>
                <Button size="small" onClick={() => addCurrentObstacle(item.bindTriggerId)}>添加障碍车</Button>
              </div>
              {item.child.length > 0 && item.child.map((item2, index2) => {
                return <div className="children" key={index2}>
                  障碍车(id:{item2.properties.id})
                  <Button size="small" onClick={() => editCurrentObstacle(item2.properties.id, 'LineString')}>编辑</Button>
                  <Button size="small" onClick={() => delCurrentObstacle(item2.properties.id)}>删除</Button>
                  <Button size="small" onClick={(e) => obstacleDetailModal(item2.properties.id, e, 'LineString')}>详细信息</Button>
                  <Modal
                    visible={obstacleModalVisible}
                    destroyOnClose={true}
                    title={<div
                      style={{
                        width: '100%',
                        cursor: 'move',
                      }}
                      onMouseOver={() => {
                        if (dragIsDisabled) {
                          setDragIsDisabled(false)
                        }
                      }}
                      onMouseOut={() => {
                        setDragIsDisabled(true)
                      }}

                    >
                      障碍车信息(支持拖拽)
                  </div>}
                    width={520}
                    footer={null}
                    maskClosable={false}
                    mask={false}
                    onCancel={() => setObstacleModalVisible(false)}
                    modalRender={modal => (
                      <Draggable
                        disabled={dragIsDisabled}
                        bounds={bounds}
                        onStart={(event, uiData) => onStart(event, uiData)}
                      >
                        <div ref={draggleRef}>{modal}</div>
                      </Draggable>
                    )}
                  >
                    <ObstacleForm
                      onValuesChange={onValuesChange}
                      onFinish={onFinish}
                      obstacleData={obstacleCurrentData}
                      onFinishFailed={onFinishFailed}
                      distanceList={distanceList}
                    />
                  </Modal>
                </div>
              })}
            </li>
          })}
        </ul>
      </div>
    </>
  )
}

export default RenderObstacleInfo