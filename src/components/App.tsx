import * as React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import "./../assets/scss/App.scss";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Playlists } from "./Playlists";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import PlaylistExplorer from "./PlaylistExplorer";
import styled from "styled-components";
import { Button } from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      backgroundColor: "#fafafa",
      minHeight: "101vh",
    },
    title: {
      flexGrow: 1,
    },
    header: {
      color: "whitesmoke",
    },
  })
);

export const StyledLink = styled(Link)`
  text-decoration: none;

  &:focus,
  &:hover,
  &:visited,
  &:link,
  &:active {
    text-decoration: none;
  }
`;

const App = (props: {}) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              <StyledLink to={"/"} className={classes.header}>
                YouTube Playlist Autosub Explorer
              </StyledLink>
            </Typography>
            <StyledLink to={"/"}>
              <Button
                variant="outlined"
                style={{ color: "whitesmoke", borderColor: "whitesmoke" }}
              >
                Home
              </Button>
            </StyledLink>
          </Toolbar>
        </AppBar>
        <Route exact={true} path="/" component={Playlists} />
        <Route path="/p/:playlistId" component={PlaylistExplorer} />
      </Router>
    </div>
  );
};

export default App;
