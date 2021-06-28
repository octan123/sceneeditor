import React, { useEffect, useRef } from 'react'
import { Form, InputNumber } from 'antd'
import _ from 'lodash'

const VehicleForm = (props) => {
  const formRef = useRef()
  const { onValuesChange, data } = props
  const initialValues = {
    'headings-0': data[0].angle,
    'headings-1': data[1].angle
  }
  useEffect(() => {
    formRef.current.setFieldsValue(initialValues)
  }, [props.data]);
  return (
    <div className="obstacle-form obstacle-form2">
      <Form
        onValuesChange={onValuesChange}
        ref={formRef}
        initialValues={initialValues}
      >
        <div className="obstacle-form-list" >
          <div className="obstacle-form-list-child">
            <Form.Item
              label="起点方向"
              name={`headings-0`}
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
              label="终点方向"
              name={`headings-1`}
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
      </Form>
    </div>
  )
}

export default VehicleForm