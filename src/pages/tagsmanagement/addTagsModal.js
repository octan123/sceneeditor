import React from 'react'
import { Button, Modal, Form, Input, InputNumber } from 'antd'
import './style.less'
import { addTagsFunc } from './api'

// 带业务接口的业务组件

const AddTagsModal = (props) => {
  const { isVisible, setIsVisible, callBack } = props
  const addNewTags = async (e) => {
    const res = await addTagsFunc(e)
    if (res?.data?.retCode === 'succeeded') {
      setIsVisible(false)

      return callBack(e.name)
    }
  }
  const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
  }
  const tailLayout = {
    wrapperCol: { offset: 4, span: 20 },
  }
  return (
    <>
      <Modal
        visible={isVisible}
        title={'新增标签'}
        onCancel={() => setIsVisible(false)}
        footer={null}
      >
        <Form
          {...layout}
          onFinish={addNewTags}
          className="from-box"
        >
          <Form.Item
            label="标签名称"
            name="name"
            rules={[{ required: true, message: '标签名称不能为空' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="排序id"
            name="sortValue"
          // rules={[{ required: true, message: '排序id必须大于0' }]}
          >
            <InputNumber min={0} max={Infinity} />
          </Form.Item>
          <Form.Item
            label="标签大类"
            name="categroy"
            rules={[{ required: true, message: '分类不能为空' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit">
              确定
        </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AddTagsModal