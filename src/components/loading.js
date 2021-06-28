import React from 'react'
import { Spin } from 'antd'

const Loading = () => {
  return (
    <div style={{
      position:'relative',
      width:'100%',
      height:'600px',
    }}>
      <Spin
        style={{
          position: 'absolute',
          top:'50%',
          left:'50%',
          transform:'translate(-50%, -50%)'
        }}
      />
    </div>
  )
}

export default Loading