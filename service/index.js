var express = require('express')
var app = express()
var ffi = require('ffi')

var Struct = require('ref-struct')
var ArrayType = require('ref-array')

var routePoint = Struct({  // 注意返回的`Class`是一个类型
  x: 'double',
  y: 'double',
  heading: 'double'
});
var ArrayPoints = ArrayType(routePoint);

var trajectoryLib = ffi.Library('./libTrajectoryLib', {
  'getAllTrajectoryPoints': ['string', ['int', ArrayPoints, 'int']],
  'clean': ['void', []]
})

app.get('/getBezier', function (req, res) {
  // 1, [{ x: 285, y: 3, heading: 10 }, { x: 293, y: 63, heading: 90 }, { x: 290, y: 112, heading: 90 }], 3
  const params = req.query
  const routePoints = trajectoryLib.getAllTrajectoryPoints(params.type, params.pointsarray.map(d => JSON.parse(d)), params.pointslength)
  trajectoryLib.clean()
  res.end(routePoints)
})

var server = app.listen(9090, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})
