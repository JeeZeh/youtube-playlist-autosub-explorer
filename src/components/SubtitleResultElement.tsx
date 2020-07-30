import * as React from "react";
import Typography from "@material-ui/core/Typography";
import { SubSearchResult } from "./PlaylistExplorer";
import { VideoInfo } from "../../ytdl";
import { Play } from "react-feather";
import { LinearProgress, ListItemIcon } from "@material-ui/core";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { createStyles, withStyles, Theme } from "@material-ui/core/styles";

const BorderLinearProgress = withStyles((theme: Theme) =>
  createStyles({
    root: {
      height: 5,
      borderRadius: 5,
      marginTop: 5,
    },
    colorPrimary: {
      backgroundColor:
        theme.palette.grey[theme.palette.type === "light" ? 200 : 700],
    },
    bar: {
      borderRadius: 5,
      backgroundColor: "#1a90ff",
    },
  })
)(LinearProgress);

interface SubtitleResultElementProps {
  index: number;
  style: React.CSSProperties;
  video: VideoInfo;
  flexResults: SubSearchResult[];
}

const formatSeconds = (input: number) => {
  let hours: any = Math.floor(input / 3600);
  let minutes: any = Math.floor((input - hours * 3600) / 60);
  let seconds: any = input - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return hours + ":" + minutes + ":" + seconds;
};

export const SubtitleResultElement = (props: SubtitleResultElementProps) => {
  const { index, style, video, flexResults } = props;
  if (!video) return <ListItem></ListItem>;
  const sub = flexResults[index].part;
  const appearsAt = Math.floor(sub.start / 1000);
  return (
    <ListItem
      button
      style={style}
      key={index}
      divider
      onClick={() => {
        window.open(`https://youtu.be/${video.id}?t=${appearsAt - 2}`);
      }}
    >
      <ListItemIcon
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: 20,
          paddingTop: 10,
          textAlign: "center",
        }}
      >
        <Play style={{ margin: "auto auto", paddingBottom: 5 }} />
        <Typography
          component="span"
          variant="body2"
          color="textSecondary"
          noWrap
        >
          {formatSeconds(appearsAt)}
        </Typography>
      </ListItemIcon>
      <ListItemText
        primary={sub.part}
        secondary={
          <>
            <Typography
              component="span"
              variant="body2"
              color="textSecondary"
              noWrap
            >
              {video.title}
            </Typography>
            <BorderLinearProgress
              value={(appearsAt / video.duration) * 100}
              variant="determinate"
            />
          </>
        }
      />
    </ListItem>
  );
};
