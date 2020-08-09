import * as React from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import "./../assets/scss/App.scss";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Playlists } from "./Playlists";
import DownloadBar from "./DownloadBar";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import PlaylistExplorer from "./PlaylistExplorer";
import styled from "styled-components";
import { Button } from "@material-ui/core";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createMuiTheme } from "@material-ui/core/styles";

const theme = createMuiTheme({
  palette: {
    primary: {
      light: "#757ce8",
      main: "#3f50b5",
      dark: "#002884",
      contrastText: "#fff",
    },
    secondary: {
      light: "#ff7961",
      main: "#f44336",
      dark: "#ba000d",
      contrastText: "#000",
    },
  },
});

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
    bar: {
      justifyContent: "space-between",
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
        <AppBar position="sticky">
          <Toolbar className={classes.bar}>
            <div>
              <Typography variant="h6" className={classes.title}>
                <StyledLink to={"/"} className={classes.header}>
                  YouTube Playlist Autosub Explorer
                </StyledLink>
              </Typography>
            </div>

            <DownloadBar toastController={toast} />
            <div>
              <StyledLink to={"/"}>
                <Button
                  variant="outlined"
                  style={{ color: "whitesmoke", borderColor: "whitesmoke" }}
                >
                  Home
                </Button>
              </StyledLink>
            </div>
          </Toolbar>
        </AppBar>
        <ToastContainer />
        <Route exact={true} path="/" component={Playlists} />
        <Route path="/p/:playlistId" component={PlaylistExplorer} />
      </Router>
    </div>
  );
};

export default App;
