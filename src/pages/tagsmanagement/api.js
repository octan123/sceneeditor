import axios from '@src/http'

export const addTagsFunc = (params) => {
  return axios.post('/api/simu-mgr/label/create', params)
}

export const getTagsList = (params) => {
  return axios.post(`/api/simu-mgr/label/query/list`, 
  params,
  )
}


export const editTagsFunc = (params) => {
  return axios.post('/api/simu-mgr/label/edit', params)
}

export const delTagsFunc = (params) => {
  return axios.post('/api/simu-mgr/label/delete', {
    id:[params]
  })
}
