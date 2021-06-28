import React from 'react'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'

import {
  Layout,
  Button
} from 'antd';
import 'antd/dist/antd.css'
import './App.less'

import Loadable from 'react-loadable'
import Loading from '@src/components/loading'
import MenuConfig from './config/menu.config'

const genMenuRoute = () => {
  return MenuConfig.reduce((rst, curItem) => {
    return [
      ...rst,
      ...curItem.subMenu.map(i => <Route key={i.url} exact={i.isExact} path={i.url} component={i.component} />)
    ]
  }, [])
}

const Editmanage = Loadable({
  loader: () => import('./pages/editmanagement/scenes'),
  loading: Loading
})

const { Header, Content } = Layout;

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Editmanage} />
      </Switch>
    </Router>
  );
}

export default App;
