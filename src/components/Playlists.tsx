import * as React from "react";
import { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import "./../assets/scss/App.scss";
import { PlaylistMetadata } from "../../server";
import { getPlaylistMetadata } from "./PlaylistApi";
import { CircleLoader } from "react-spinners";

import {
  Card,
  CardMedia,
  CardContent,
  Button,
  CardActions,
  Typography,
  Grid,
  Divider,
} from "@material-ui/core";
import { StyledLink } from "./App";

const useStyles = makeStyles({
  root: {
    maxWidth: 300,
  },
  media: {
    height: 150,
  },
  grid: { justifyContent: "center" },
  wrapper: {
    maxWidth: 800,
    margin: "auto",
  },
});

export const Playlists = () => {
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>();
  const classes = useStyles();

  useEffect(() => {
    getPlaylistMetadata().then(setPlaylists);
  }, []);

  const renderPlaylist = (p: PlaylistMetadata) => {
    return (
      <Card className={classes.root}>
        <CardMedia
          className={classes.media}
          image={p.thumbnail}
          title="Playlist Thumbnail"
        />
        <CardContent>
          <Typography gutterBottom variant="h6" component="h5" noWrap>
            {p.id}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            Videos: {p.videoCount}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            Videos with Subs: {p.videosWithSubs}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            Playlist Length: {p.totalLength}
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" color="primary">
            <StyledLink
              to={{
                pathname: `/p/${p.id}`,
                state: {
                  metadata: p,
                },
              }}
            >
              Explore
            </StyledLink>
          </Button>
          <Button
            size="small"
            color="secondary"
            onClick={() =>
              window.open("https://youtube.com/playlist?list=" + p.id, "_blank")
            }
          >
            View on YouTube
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Grid container className={classes.wrapper} direction="column" spacing={5}>
      <Grid container item spacing={2} direction="column">
        <Grid item>
          <Typography variant="h3">Playlists</Typography>
        </Grid>
        <Grid item>
          <Divider />
        </Grid>
      </Grid>

      <Grid container item spacing={3} className={classes.grid}>
        {playlists &&
          playlists.map((p, i) => (
            <Grid item key={i}>
              {renderPlaylist(p)}
            </Grid>
          ))}
        {!playlists && <CircleLoader />}
      </Grid>
    </Grid>
  );
};
