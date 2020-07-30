import * as React from "react";
import { render } from "react-dom";
import App from "./components/App";

const rootEl = document.getElementById("root");

render(<App />, rootEl);

if (module.hot) {
  module.hot.accept("./components/App", () => {
    const NextRootContainer = require("./components/App").default;
    render(<NextRootContainer />, rootEl);
  });
}
