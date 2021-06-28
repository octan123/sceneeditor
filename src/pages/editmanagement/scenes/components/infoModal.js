import React, { useEffect, useRef, useState } from 'react'
import { Form, InputNumber, Modal } from 'antd'
import {
  getFeaturesTypeArr, getNextSpeed, getNextTime
} from '../lib'

const CarModal = (props) => {
  let timer
  const { data, styleObj, featureIndex, carIndex, setTestFeatures, renderRoute, distanceList } = props
  const onValuesChange = (changedValues, allValues) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      onFinish(allValues)
    }, 1000)
  }
  const onFinish = (values) => {
    try {
      let features = data.features
      const speedArr = features[featureIndex].properties.velocity
      const headingsArr = features[featureIndex].properties.headings
      const timeArr = features[featureIndex].properties.time
      for (let i in values) {
        if (i.indexOf('velocity') > -1) {
          speedArr[carIndex] = values[i]
        }
        if (i.indexOf('time') > -1) {
          timeArr[carIndex] = values[i]
        }
        if (i.indexOf('headings') > -1) {
          headingsArr[carIndex] = values[i]
        }
      }
      features[featureIndex].properties.velocity = speedArr
      features[featureIndex].properties.time = timeArr
      features[featureIndex].properties.headings = headingsArr
      const testFeaturesTemp = Object.assign({}, data, {
        features,
      });
      setTestFeatures(testFeaturesTemp)
      const obstaclesData = getFeaturesTypeArr(testFeaturesTemp, 'Polygon')
      renderRoute(features[featureIndex], obstaclesData)
    } catch (error) {
      console.error(erroe)
    }
  }

  const getStyles = () => {
    let obj = {}
    if (styleObj.top >= (180 + 40)) {
      obj.top = styleObj.top - 180 - 40
    } else {
      obj.top = styleObj.top + 40
    }
    if (styleObj.left >= (280 / 2 + 40)) {
      if (document.getElementById('h_resize_container').offsetWidth - styleObj.left <= 140) {
        obj.left = document.getElementById('h_resize_container').offsetWidth - 280
      } else {
        obj.left = styleObj.left - 280 / 2
      }

    } else {
      obj.left = 0
    }
    return obj
  }

  const formRef = useRef()
  let initVals = {}
  initVals = {
    'headings': data?.features[featureIndex[0]]?.properties?.headings[carIndex],
    'velocity': data?.features[featureIndex[0]]?.properties?.velocity[carIndex],
    'time': carIndex === 0 ? 0 : data?.features[featureIndex[0]]?.properties?.time[carIndex]
  }
  const [initialValues, setInitialValues] = useState(initVals)
  const updateInitVals = (vals) => {
    let newValues = {
      ...initialValues,
      ...vals
    }
    setInitialValues(newValues)
  }
  useEffect(() => {
    formRef.current.setFieldsValue(initialValues)
    return () => {
      onFinish(initialValues)
    }
  }, [data?.features[featureIndex[0]], initialValues]);
  return (
    <div className="info-pop" style={getStyles()}>
      <div className={styleObj.top >= (180 + 40) ? 'arrow' : 'arrow-up'} ></div>
      <div className="obstacle-form obstacle-form2">
        <Form
          onValuesChange={onValuesChange}
          ref={formRef}
          initialValues={initialValues}
        >
          <div className="obstacle-form-list" >
            <div className="obstacle-form-list-child">
              <Form.Item
                label="方向"
                name={`headings`}
                rules={[
                  {
                    required: true,
                    message: '方向范围为-360-360',
                    type: 'number', min: -360, max: 360
                  }
                ]}
              >
                <InputNumber step={1} />
              </Form.Item>
            </div>
          </div>
          <div className="obstacle-form-list" >
            <div className="obstacle-form-list-child">
              <Form.Item
                label="速度"
                name={`velocity`}
                validateTrigger="onBlur"
                rules={[
                  {
                    required: true,
                    message: '速度不能小于0',
                    type: 'number', min: -1, max: 999,
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (carIndex === 0) {
                        return Promise.resolve()
                      }
                      let v1 = data?.features[featureIndex[0]]?.properties?.velocity[carIndex - 1] || 0
                      let v2 = value
                      const s = distanceList[carIndex - 1]
                      let t = getNextTime(s, v1, v2)
                      if (t >= 0 && t !== Infinity) {
                        let currentVelocity = {}
                        currentVelocity.velocity = value
                        currentVelocity.time = t + Number(data?.features[featureIndex[0]]?.properties?.time[carIndex - 1] || 0)
                        updateInitVals(currentVelocity)
                        return Promise.resolve()
                      } else {
                        return Promise.reject(new Error('当前速度不符合要求'));
                      }
                    }
                  }),
                ]}
              >
                <InputNumber />
              </Form.Item>
            </div>
          </div>
          <div className="obstacle-form-list" >
            <div className="obstacle-form-list-child">
              <Form.Item
                label="时间"
                name={`time`}
                validateTrigger="onBlur"
                rules={[
                  {
                    trigger: "onBlur",
                    required: true,
                    message: '时间不能小于0',
                    type: 'number', min: 0, max: 9999
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      let currentVelocity = {}
                      if (carIndex === 0) {
                        currentVelocity.time = value
                        updateInitVals(currentVelocity)
                        return Promise.resolve()
                      }
                      let v // 上一个点的速度
                      const t = value - (data?.features[featureIndex[0]]?.properties?.time[carIndex - 1] || 0)
                      const s = distanceList[carIndex - 1]
                      if (t <= 0) {
                        return Promise.reject(new Error('当前时间不能小于上一个时间'));
                      }
                      v = data?.features[featureIndex[0]]?.properties?.velocity[carIndex - 1] || 0
                      let obj = {}
                      let prevV = getNextSpeed(s, v, t)
                      prevV = isNaN(prevV) ? 0 : prevV
                      obj[carIndex] = prevV
                      if (prevV >= 0) {
                        currentVelocity[`velocity`] = prevV
                        currentVelocity[`time`] = value
                        updateInitVals(currentVelocity)
                        return Promise.resolve()
                      } else {
                        return Promise.reject(new Error('错误，根据时间计算当前路径点速度为负数！'))
                      }
                    },
                  }),
                ]}
              >
                <InputNumber min={0} disabled={carIndex === 0} />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default CarModal