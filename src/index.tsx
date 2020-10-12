import * as React from "react";
import { render } from "react-dom";

import App from "./App";
import {BrowserRouter as Router} from "react-router-dom";

const rootElement = document.getElementById("root");
render(<Router><App /></Router>, rootElement);
