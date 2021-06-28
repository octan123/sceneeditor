
import { IS_COLLAPSED } from '../actions'
const initialState = {
  isCollapsed: true
}

const adsiderReducer = (state = initialState, action) => {
  switch (action.type) {
    case IS_COLLAPSED:
      return Object.assign({}, state, { isCollapsed: action.data })
    default:
      return state
  }
}
export default adsiderReducer