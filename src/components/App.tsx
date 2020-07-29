import * as React from "react";
import { useState, useEffect, useContext } from "react";
import { hot } from "react-hot-loader";
import "./../assets/scss/App.scss";
import styled from "styled-components";
import { PlaylistMetadata } from "../../server";
import { getPlaylists } from "./PlaylistApi";
import { Playlists } from "./Playlists";

const Body = styled.div``;

const App = (props: {}) => {
  return (
    <Body>
      <h1>Youtube Autosub Explorer</h1>
      <Playlists />
    </Body>
  );
};

declare let module: object;

export default App;
