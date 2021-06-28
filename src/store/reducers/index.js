import { combineReducers } from 'redux'
import adsiderReducer from './adsider.js'

const appReducer = combineReducers({
  adsiderReducer,
})

export default appReducer