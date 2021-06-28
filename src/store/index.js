import {createStore, applyMiddleware, } from "redux"
import reducers from "./reducers"

export const store = createStore(reducers)
