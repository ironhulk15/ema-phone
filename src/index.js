import React from 'react';
//import ReactDOM from 'react-dom';
import './index.css';
import App from './App.jsx';


import * as serviceWorker from './serviceWorker';
//import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

//ReactDOM.render(<App />, document.getElementById('root'));

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
    //<StrictMode>
        <App />
    //</StrictMode>
);
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
