import * as React from "react";
import { useState } from "react";
import Typography from "@material-ui/core/Typography";
import { SubSearchResult } from "./PlaylistExplorer";
import { downloadPlaylist } from "./PlaylistApi";
import { VideoInfo } from "../../ytdl";
import { Play, Send } from "react-feather";
import {
  LinearProgress,
  ListItemIcon,
  TextField,
  Button,
  Grid,
} from "@material-ui/core";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import { IconButton } from "@material-ui/core/";
import { Toast } from "react-toastify/dist/components";

const styles = {
  root: {
    maxWidth: 400,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: 300,
    color: "whitesmoke",
  },
};

const DownloadBar = (props: any) => {
  const { classes, toastController } = props;
  const [inputValue, setInputValue] = useState("");

  const searchPlaylist = async () => {
    if (inputValue === "") {
      toastController.error("Please enter a playlist ID or URL", {
        progress: 0,
        autoClose: false,
      });
      return;
    }

    toastController.info(
      "Attempting to download playlist. This might take a while, so check the console output for progress updates",
      { progress: 0, autoClose: false }
    );
    const download = await downloadPlaylist(inputValue);
    if (!download.success) {
      toastController.error(download.message, {
        progress: 1,
        autoClose: false,
      });
      console.error("Error downloading playlist", download);
      return;
    }

    toastController.success("Download succeeded, refresh your playlists!", {
      progress: 1,
      autoClose: false,
    });
  };

  return (
    <Grid container className={classes.root}>
      <Grid item>
        <TextField
          variant="standard"
          placeholder="Download a playlist"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          InputProps={{
            className: classes.input,
          }}
        />
      </Grid>
      <Grid item>
        <IconButton onClick={() => searchPlaylist()}>
          <Send color="whitesmoke" />
        </IconButton>
      </Grid>
    </Grid>
  );
};

DownloadBar.propTypes = {
  classes: PropTypes.object.isRequired,
  toastController: PropTypes.func.isRequired,
};

export default withStyles(styles)(DownloadBar);
