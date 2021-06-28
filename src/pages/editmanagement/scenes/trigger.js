// 绘制完障碍车路线后，默认在起点附近绘制一个trigger
export const createDefaultTirgger = (position, id) => {
  // TODO 颜色
  if (!position) {
    console.error('创建触发器的位置数组没传入')
    return
  }
  const data = {
    "type": "Feature",
    "properties": {
      "stroke": "#800000",
      "stroke-width": 3,
      "stroke-opacity": 0.5,
      "fill": "#ffff66",
      "fill-opacity": 1,
      shape: "Rectangle",
      id: (id ? id : 1009),
      featureIndex: (id ? id : 1009),
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [position]
    }
  }
  return data
}

