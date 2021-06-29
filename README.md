# sceneeditor
![sceneEditor](https://user-images.githubusercontent.com/19968677/123817336-a54be380-d92a-11eb-896c-985e14173ccc.gif)
automatic driving scene editor
技术栈：React，deck.gl
加载openDrive高精地图，绘制主车的起始位置和方向，绘制障碍车的行驶路径关键点，根据bezier生成曲线，支持生成yaml文件。

启动方式
yarn
yarn start
即可启动前端

bezier曲线生成服务在service目录中，因为库的原因只能支持老版node，我的当前版本是v4.9.0
启动方式
使用nvm管理多个版本node，切换到v.4.9.0
npm install(不支持yarn)
node index.js

TODO
支持OpenSCENARIO
采用WebAssembly生成bezier曲线
