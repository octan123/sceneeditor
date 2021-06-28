import React, { useState, useEffect } from 'react'
import { Input, Select, Button } from 'antd'
import AddTagsModal from '@src/pages/tagsmanagement/addTagsModal'
import { getTagsList } from '@src/pages/tagsmanagement/api'
import {
  createTask,
  isEdited,
  getQueryString
} from '../lib'

const { Option } = Select
const CreateScenesContent = (props) => {
  const { mapId, testFeatures, screenshotCallback,editData } = props
  const [isCreating2, setIsCreating2] = useState(false)
  const [isTagsVisible, setIsTagsVisible] = useState(false)
  const [selectedArr, setSelectedArr] = useState([])
  const [tagList, setTagList] = useState([])
  const [scenesName, setScenesName] = useState('')
  const [description, setDescription] = useState('')
  const getTagsListFunc = async (params) => {
    const res = await getTagsList(params)
    if (res?.data?.retCode === 'succeeded') {
      setTagList(res.data.listData)
    }
  }
  const handleSelectChange = (value) => {
    setSelectedArr(value)
  }
  useEffect(() => {
    getTagsListFunc({ current: 1 })
    if (editData?.description) {
      setDescription(editData.description)
    }
    if (editData?.name) {
      setScenesName(editData.name)
    }
  }, [])
  return (
    <>
      <AddTagsModal
        isVisible={isTagsVisible}
        setIsVisible={setIsTagsVisible}
        callBack={(id) => {
          getTagsListFunc({ current: 1 })
          const newArr2 = JSON.parse(JSON.stringify(selectedArr))
          newArr2.push(id)
          setSelectedArr(newArr2)
        }}
      />
      <div className="create-scene-box">
        <div className="cra-scene-list">
          <div className="label"><span className="red">*</span>请输入名称：</div>
          <div className="info">
            <Input value={scenesName} defaultValue={'请输入场景名称'} onChange={(e) => setScenesName(e.target.value)} style={{ width: '200px' }} />
          </div>
        </div>
        <Button
          type="primary"
          loading={isCreating2}
          onClick={() => createTask(
            {
              mapId, testFeatures,
              setIsCreating2,
              scenesName,
              selectedArr,
              description,
              screenshotCallback,
              isEdited:isEdited(),
              id:getQueryString('id')
            }
          )}
        >{isEdited() ? '修改场景' : '创建场景'}</Button>
      </div>
    </>
  )
}

export default CreateScenesContent
