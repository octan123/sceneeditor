import React, { useEffect, useRef } from 'react'

import rotateImg from '../imgs/rotate.png'

const formatAngle = (number) => {
  let newNum = Math.abs(number)
  let count = Math.floor(newNum / 360)
  if (number >= 0) {
    return newNum - 360 * count
  }
  return -(newNum - 360 * count)
}
const CreateEditArrow = (info) => {
  let timer
  const sylesObj = {
    top: info.eventInfo.center.y - 60 * info.zoom / 10 - 64 + 'px',
    left: info.eventInfo.center.x - 60 * info.zoom / 10 - 80 + 'px',
  }
  const arrowRef = useRef()
  const arrowParentRef = useRef()
  let model = {
    cnv: {},

  }
  try {
    if (info && info.isGuide && info.object.properties.featureIndex > 1) {
      model.angle = (info.testFeatures.features[info.object.properties.featureIndex].properties.headings[info.index])
    } else {
      model.angle = (info.iconLayerData[info.index].angle)

    }
  } catch (error) {
    model.angle = 0
    console.error(error)
  }

  const getAngle = (cX, cY, mX, mY) => {
    var x = Math.abs(cX - mX);
    var y = Math.abs(cY - mY);
    var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    var cos = y / z;
    var radina = Math.acos(cos);//用反三角函数求弧度
    var angle = Math.floor(180 / (Math.PI / radina));//将弧度转换成角度

    if (mX > cX && mY > cY) {//鼠标在第四象限
      angle = 180 - angle;
    }

    if (mX == cX && mY > cY) {//鼠标在y轴负方向上
      angle = 180;
    }

    if (mX > cX && mY == cY) {//鼠标在x轴正方向上
      angle = 90;
    }

    if (mX < cX && mY > cY) {//鼠标在第三象限
      angle = 180 + angle;
    }

    if (mX < cX && mY == cY) {//鼠标在x轴负方向
      angle = 270;
    }

    if (mX < cX && mY < cY) {//鼠标在第二象限
      angle = 360 - angle;
    }
    return -(angle)
  }
  let mouseDownFunc
  let mouseMoveFunc
  let mouseMoveOut
  const createArrow = () => {

    model.cnv = arrowRef.current
    const antLayoutContentDom = arrowParentRef.current.parentNode.parentNode
    let cX, cY;
    let offX = 0, offY = 0;
    let adsiderWidth = info.adsiderCollapsed ? 80 : 200
    const updateRectangle = (ang) => {
      ang = formatAngle(ang)
      // parentNode.parentNode 为 calss=ant-layout-content 的div （如顶层布局有修改，会导致箭头旋转错误）
      // 如此处报错应检查顶层布局是否有修改
      // offX 需要加上当前arrowParentRef 父级->父级的宽度
      offX = arrowParentRef.current.offsetLeft + adsiderWidth
      // offX += antLayoutContentDom.offsetLeft
      // 64 为头部导航偏移量，因头部高度固定写死64
      offY = arrowParentRef.current.offsetTop + 64
      // let x = 0;
      // let y = 0;
      // let width = 100;
      // let height = 100;
      cX = info.eventInfo.center.x
      cY = info.eventInfo.center.y

      model.cnv.style.transform = `rotate(${ang}deg)`;

      if (info.getEditIconAngle && ang) {
        info.getEditIconAngle(ang, info.index, info.isGuide, info.featureIndex)
        // if (timer) {
        //   clearTimeout(timer)
        // }
        // timer = setTimeout(() => {
        //   info.getEditIconAngle(ang, info.index, info.isGuide, info.object.properties && info.object.properties.featureIndex)
        // }, 16)

      }
    }
    let clickAngle2
    updateRectangle(model.angle)
    mouseDownFunc = (event) => {
      clickAngle2 = getAngle(cX, cY, event.clientX, event.clientY) - model.angle
      arrowParentRef.current.addEventListener('mousemove', mouseMoveFunc)

    }
    mouseMoveFunc = (event) => {
      model.angle = (getAngle(cX, cY, event.clientX, event.clientY) - clickAngle2)
      updateRectangle(model.angle);
    }
    mouseMoveOut = () => {
      arrowParentRef.current.removeEventListener('mousemove', mouseMoveFunc)
    }
    arrowParentRef.current.addEventListener('mousedown', mouseDownFunc)
    arrowParentRef.current.addEventListener('mouseup', mouseMoveOut)
    arrowParentRef.current.addEventListener('mouseout', mouseMoveOut)
  }
  useEffect(() => {
    createArrow()
    return () => {
      mouseMoveOut()
      clearTimeout(timer)
    }
  }, [info.eventInfo.center.x, info.index, info.isGuide]);
  const renderArrow = () => {
    return (
      <div
        ref={arrowParentRef}
        id="box"
        draggable="false"
        style={{
          width: `${140 * info.zoom / 10}px`,
          height: `${140 * info.zoom / 10}px`,
          position: 'absolute',
          zIndex: 999,
          cursor: `url(${rotateImg}) 0 0, auto`,

          ...sylesObj
        }}
      >
        <div
          id="canvas"
          draggable="false"
          ref={arrowRef}
          unselectable="on"
          style={{
            background: `rgba(0,0,0,.4)`,
            width: `${140 * info.zoom / 10}px`,
            height: `${140 * info.zoom / 10}px`,
            overflow: 'hidden',

          }}
        >
        </div>
      </div>
    )
  }
  return (
    <>
      {renderArrow()}
    </>
  )
}

export default CreateEditArrow