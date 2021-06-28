import React, { useEffect, useRef, useState } from 'react'
import { Form, InputNumber, Button } from 'antd'
import _ from 'lodash'
import { getNextSpeed, getNextTime } from '../lib'

const ObstacleForm = (props) => {
  const [prevVelocity, setPrevVelocity] = useState({})
  const formRef = useRef()
  const { onFinish, onFinishFailed, obstacleData, distanceList, onValuesChange } = props
  // 坐标点数组， 第一个点坐标，第二个点坐标[[110.323432，221.423432], [110.323432，221.423432]]
  const dataArr = obstacleData.geometry.coordinates
  // 方向数组
  const dataArr2 = obstacleData.properties.headings
  // 速度数组
  const dataArr3 = obstacleData.properties.velocity ? obstacleData.properties.velocity : []
  // 时间数组
  const dataArr4 = obstacleData.properties.time ? obstacleData.properties.time : []
  let initVals = {}

  dataArr2.map((item, index) => {
    initVals[`headings-${index}`] = item
    initVals[`velocity-${index}`] = dataArr3[index] ? dataArr3[index] : 0
    initVals[`time-${index}`] = dataArr4[index] ? dataArr4[index] : 0
  })
  const [initialValues, setInitialValues] = useState(initVals)

  useEffect(() => {
    formRef.current.setFieldsValue(initialValues)
  }, [dataArr2, obstacleData, initialValues])

  const updateInitVals = (vals) => {
    let newValues = {
      ...initialValues,
      ...vals
    }
    setInitialValues(newValues)
  }
  return (
    <div className="obstacle-form">
      <Form
        onValuesChange={onValuesChange}
        ref={formRef}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        initialValues={initialValues}
      >
        {
          dataArr.length > 0 && dataArr.map((item, index) => {
            return <div className="obstacle-form-list" key={index}>
              <div className="obstacle-form-list-label" >
                路径点{index + 1}:
              </div>
              <div className="obstacle-form-list-child">
                <Form.Item
                  label="方向"
                  name={`headings-${index}`}
                  rules={[
                    {
                      required: true,
                      message: '方向范围为-360-360',
                      type: 'number', min: -360, max: 360
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        let currentVelocity = {}
                        currentVelocity[`headings-${index}`] = value
                        updateInitVals(currentVelocity)
                        return Promise.resolve()
                      }
                    }),
                  ]}
                >
                  <InputNumber step={5} width={20} />
                </Form.Item>
                <Form.Item
                  label="速度"
                  name={`velocity-${index}`}
                  validateTrigger="onBlur"
                  rules={[
                    {
                      required: true,
                      message: '速度不能小于0',
                      type: 'number', min: 0, max: 999,
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        let currentVelocity = {}
                        currentVelocity[`velocity-${index}`] = value
                        if (index === 0) {
                          setPrevVelocity({
                            0: value
                          })
                          currentVelocity[`time-${index}`] = 0
                          updateInitVals(currentVelocity)
                          return Promise.resolve()
                        }
                        let v1 = getFieldValue(`velocity-${index - 1}`) || 0
                        let v2 = getFieldValue(`velocity-${index}`)
                        const s = distanceList[index - 1]
                        let t = getNextTime(s, v1, v2)
                        if (t >= 0 && t !== Infinity) {
                          currentVelocity[`time-${index}`] = t + Number(getFieldValue(`time-${index - 1}`) || 0)
                          updateInitVals(currentVelocity)
                          return Promise.resolve()
                        } else {
                          return Promise.reject(new Error('当前速度不符合要求'));
                        }
                      }
                    }),
                  ]}
                >
                  <InputNumber width={40} />
                </Form.Item>
                <Form.Item
                  label="时间"
                  name={`time-${index}`}
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
                        if (index === 0) {
                          currentVelocity[`time-${index}`] = value
                          updateInitVals(currentVelocity)
                          return Promise.resolve()
                        }
                        let v // 上一个点的速度
                        const t = getFieldValue(`time-${index}`) - getFieldValue(`time-${index - 1}`)
                        const s = distanceList[index - 1]
                        if (t <= 0) {
                          return Promise.reject(new Error('当前时间不能小于上一个时间'));
                        }
                        v = prevVelocity[index - 1] || 0
                        let obj = {}
                        let prevV = getNextSpeed(s, v, t)
                        prevV = isNaN(prevV) ? 0 : prevV
                        obj[index] = prevV
                        setPrevVelocity({
                          ...prevVelocity,
                          ...obj
                        })
                        if (prevV >= 0) {
                          currentVelocity[`velocity-${index}`] = prevV
                          currentVelocity[`time-${index}`] = value
                          updateInitVals(currentVelocity)
                          return Promise.resolve()
                        } else {
                          return Promise.reject(new Error('错误，根据时间计算当前路径点速度为负数！'))
                        }
                      },
                    }),
                  ]}
                >
                  <InputNumber min={0} width={40} disabled={index === 0} />
                </Form.Item>
              </div>
            </div>
          })
        }

        <div className="button-list">
          <Form.Item >
            <Button type="primary" htmlType="submit">
              确认修改
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  )
}

export default ObstacleForm