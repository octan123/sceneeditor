import React from 'react'
import {
  EditOutlined,
} from '@ant-design/icons'
import Loadable from 'react-loadable'
import Loading from '@src/components/loading'

const ScenesEditPage = Loadable({
  loader: () => import('../../pages/editmanagement/scenes'),
  loading: Loading
})

export default [{
  id: 'edit',
  title: '编辑管理',
  icon: <EditOutlined />,
  subMenu: [
    {
      id: 'edit-scenes',
      title: '场景编辑',
      url: '/edit/scenes',
      component: ScenesEditPage
    }
  ]
}]