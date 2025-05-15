import { combineReducers, createStore, applyMiddleware, compose } from 'redux';

import { reducer as applicationReducer, middleware as applicationMiddleware } from './application';
import { reducer as apiReducer, middleware as apiMiddleware } from './api';

const composeEnhancers = window && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const reducers = combineReducers({
	application: applicationReducer,
	api: apiReducer
});

export default createStore(reducers, composeEnhancers(applyMiddleware(...applicationMiddleware, ...apiMiddleware)));
