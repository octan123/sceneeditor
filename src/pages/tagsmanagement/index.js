import React, { useRef, useState } from 'react';
import { PlusOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Button, Modal, Form, Input, InputNumber } from 'antd';
import ProTable, { TableDropdown } from '@ant-design/pro-table';
import { getTagsList, editTagsFunc, delTagsFunc } from './api'
import AddTagsModal from './addTagsModal'
import './style.less'


const columns = [
  // {
  //   dataIndex: 'index',
  //   valueType: 'indexBorder',
  //   width: 48,
  // },
  {
    title: '标签名称',
    dataIndex: 'name',
    copyable: true,
    ellipsis: true,
    search: true,
    // tip: '标题过长会自动收缩',
    formItemProps: {
      rules: [
        {
          required: true,
          message: '此项为必填项',
        },
      ],
    },
  },
  {
    title: '排序',
    dataIndex: 'sortValue',
    // valueType:'digit',
    search: false,
    formItemProps: {
      rules: [
        {
          required: true,
          message: '此项为必填项',
        },
      ],
    },
  },
  {
    title: '创建时间',
    key: 'showTime',
    dataIndex: 'createTime',
    valueType: 'dateTime',
    hideInSearch: true,
    editable: false,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    valueType: 'dateRange',
    editable: false,
    hideInTable: true,
    search: {
      transform: (value) => {
        return {
          startTime: value[0],
          endTime: value[1],
        };
        
      },
    },
  },
  {
    title: '标签大类',
    dataIndex: 'category',
    search: true,
  },
  {
    title: '创建者',
    dataIndex: 'createBy',
    search: true,
    editable: false
  },
  {
    title: '操作',
    valueType: 'option',
    render: (text, record, _, action) => [
      <a
        key="editable"
        onClick={() => {
          action?.startEditable?.(record.id);
        }}
      >
        编辑
      </a>,

    ],
  },
];


const TagsManges = () => {
  const actionRef = useRef();
  const [isVisible, setIsVisible] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: 10,
  })
  const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
  }
  const tailLayout = {
    wrapperCol: { offset: 4, span: 20 },
  }
  const getData = async (params) => {
    let newParams = { ...pageInfo, page: params.current, pageSize: params.pageSize }
    if (params.name || params.createTime || params.category || params.createBy||params.startTime||params.endTime) {
      newParams.filter = {
        name: params.name || '',
        startTime: params.startTime || '',
        endTime: params.endTime || '',
        category: params.category || '',
        createBy: params.createBy || ''
      }
      if (params.startTime && params.endTime) {
        newParams.filter.createTime =`${params.startTime},${params.endTime}`
      }
    }

    // console.log(params, newParams)
    const res = await getTagsList(newParams)
    if (res?.data?.retCode === 'succeeded') {
      setDataSource(res.data.listData)
      setPageInfo(res.data.pageInfo)

    }
  }
  return (
    <>
      <AddTagsModal
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        callBack={getData}
      />
      <ProTable
        columns={columns}
        actionRef={actionRef}
        editable={{
          onSave: async (key, row) => {
            const res = await editTagsFunc(row)
            if (res?.data?.retCode === 'succeeded') {
              getData({
                ...pageInfo,
                current: pageInfo.pageIndex
              })
            }
          },
          onDelete: async (key) => {
            const res = await delTagsFunc(key)
            if (res?.data?.retCode === 'succeeded') {
              getData({
                ...pageInfo,
                current: pageInfo.pageIndex
              })
            }
          },
        }}
        dataSource={dataSource}
        request={getData}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          pageSize: pageInfo.pageSize,
          total: pageInfo.totalRowCount,
        }}
        dateFormatter="string"
        headerTitle="标签管理"
        toolBarRender={() => [
          <Button key="button" onClick={() => setIsVisible(true)} icon={<PlusOutlined />} type="primary">
            新建
          </Button>,
        ]}
      />
    </>
  )
}

export default TagsManges