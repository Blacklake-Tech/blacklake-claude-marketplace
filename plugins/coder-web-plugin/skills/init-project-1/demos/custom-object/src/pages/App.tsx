import './App.css';

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, useLocation } from 'react-router-dom';

import {
  CustomObjectList,
  CustomObjectDetail,
  CustomObjectCreate,
  CustomObjectEdit,
  CustomObjectCopy,
  customObjectPagePath,
} from './customObject';
import { postMessageManager } from '../utils/postMessage';
import { ErrorBoundaryWithRouter } from '../ErrorBoundary';

const AppContent = () => {
  const location = useLocation();

  // 监听路由变化，发送 postMessage
  useEffect(() => {
    postMessageManager.sendRouteChange(location.pathname);
  }, [location.pathname]);

  return (
    <ErrorBoundaryWithRouter>
      <Switch>
        {/* 自定义对象路由 - 首页 */}
        <Route exact path="/" component={CustomObjectList} />
        {/* 自定义对象路由 */}
        <Route exact path={customObjectPagePath.list} component={CustomObjectList} />
        <Route exact path={customObjectPagePath.create} component={CustomObjectCreate} />
        <Route exact path={customObjectPagePath.edit} component={CustomObjectEdit} />
        <Route exact path={customObjectPagePath.copy} component={CustomObjectCopy} />
        <Route exact path={customObjectPagePath.detail} component={CustomObjectDetail} />
      </Switch>
    </ErrorBoundaryWithRouter>
  );
};

function App() {
  return (
    <div className="App">
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App;
