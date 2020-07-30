import * as React from "react";
import { useEffect, useState } from "react";
import FlexSearch, { Index } from "flexsearch";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { RouteComponentProps } from "react-router-dom";
import { getPlaylist } from "./PlaylistApi";
import { PlaylistJSON, SubtitlePart } from "../../ytdl";
import { PlaylistMetadata } from "../../server";
import { Paper, Button, TextField } from "@material-ui/core";
import { CircleLoader } from "react-spinners";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import { SubtitleResultElement } from "./SubtitleResultElement";

const useStyles = makeStyles({
  wrapper: {
    padding: 20,
    width: "80vw",
    maxWidth: 750,
    margin: "auto",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    flexWrap: "nowrap",
    maxWidth: 750,
    padding: 10,
  },
  headerImg: { height: 180, borderRadius: 5 },
  headerMeta: {
    flexDirection: "column",
    justifyContent: "space-around",
    width: 400,
  },
  bar: { display: "grid", gridTemplateColumns: "auto 1fr" },
  results: {},
});

/**
 * Serialises all subtitle parts from all playlist videos by using indice ranges.
 * Flat packs all subtitles into a single array and stores indice ranges of corresponding
 * videos.
 * If a subtitle has index 30, and subtitle ranges for video 2 start at 20 and end
 * at 40, then we know subtitle 30 came from video 2 and it is the 10th subtitle.
 * @param playlist
 */
const buildIndex = (
  playlist: PlaylistJSON
): { index: Index<string>; flatSubs: FlatSubs } => {
  let flatSubs: FlatSubs = { idList: [], subs: [], idRange: [] };
  const index: Index<string> = FlexSearch.create({
    async: true,
    encode: "advanced",
  });

  for (const [id, subs] of Object.entries(playlist.subs)) {
    flatSubs.idList.push(id);
    flatSubs.idRange.push(flatSubs.subs.length + subs.length);
    flatSubs.subs.push(...subs);
  }

  flatSubs.subs.forEach((sub, i) => {
    index.add(i, sub.part);
  });

  return { index, flatSubs };
};

type RouteParams = {
  playlistId: string;
};

interface FlatSubs {
  idList: string[];
  subs: SubtitlePart[];
  idRange: number[];
}

export interface SubSearchResult {
  videoId: string;
  part: SubtitlePart;
}

const PlaylistExplorer = ({
  match,
  location,
}: RouteComponentProps<RouteParams, any, { metadata: PlaylistMetadata }>) => {
  const classes = useStyles();
  const { playlistId } = match.params;
  const { metadata } = location.state;
  const [playlist, setPlaylist] = useState<PlaylistJSON>();
  const [searchValue, setSearchValue] = useState("");
  const [flatSubs, setFlatSubs] = useState<FlatSubs>();
  const [flexIndex, setFlexIndex] = useState<Index<string>>();
  const [flexResults, setFlexResults] = useState<SubSearchResult[]>();

  /**
   * Deserialises the subtitle ID generated in buildSubs().
   * @param subIds list of sub indices from flat packed subtitle parts
   */
  const findSubParts = (subIds: string[]): SubSearchResult[] => {
    const results: SubSearchResult[] = [];
    if (!flatSubs || !playlist) return results;
    for (let subId of subIds) {
      let id = parseInt(subId);
      const idx = flatSubs.idRange.findIndex((range) => range > id);
      const videoId = flatSubs.idList[idx];
      const realSubIndex = idx === 0 ? id : id - flatSubs.idRange[idx - 1];
      const videoSubs = playlist.subs[videoId];
      results.push({ videoId, part: videoSubs[realSubIndex] });
    }

    return results;
  };

  useEffect(() => {
    getPlaylist(playlistId).then((p) => {
      setPlaylist(p);
    });
  }, []);

  useEffect(() => {
    if (playlist) {
      const { index, flatSubs } = buildIndex(playlist);
      setFlexIndex(index);
      setFlatSubs(flatSubs);
    }
  }, [playlist]);

  useEffect(() => {
    if (flexIndex && flatSubs && searchValue) {
      flexIndex.search(searchValue).then(findSubParts).then(setFlexResults);
    }
  }, [searchValue]);

  useEffect(() => {
    if (flexResults) console.log(flexResults);
  }, [flexResults]);

  const PlaylistHeader = () => {
    return (
      <Paper variant="outlined">
        <Grid container className={classes.header} spacing={2}>
          <Grid item>
            <img className={classes.headerImg} src={metadata.thumbnail}></img>
          </Grid>
          <Grid container item className={classes.headerMeta} spacing={1}>
            <Grid item xs>
              <Typography variant="h5" noWrap>
                {metadata.id}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body1" color="textPrimary" noWrap>
                Length: {metadata.totalLength}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body1" color="textPrimary" noWrap>
                Videos: {metadata.videoCount}
              </Typography>
            </Grid>

            <Grid item>
              <Typography variant="body2" color="textSecondary" noWrap>
                Videos with Subtitles: {metadata.videosWithSubs}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderRow = (props: ListChildComponentProps) => {
    const { index, style } = props;
    const video = playlist.videos[flexResults[index].videoId];
    return (
      <SubtitleResultElement
        index={index}
        style={style}
        video={video}
        flexResults={flexResults}
      />
    );
  };

  const FlexResults = () => {
    return (
      <Paper className={classes.results} variant="elevation">
        <FixedSizeList
          height={Math.min(800, flexResults.length * 80)}
          width={750}
          itemSize={80}
          itemCount={flexResults.length}
        >
          {renderRow}
        </FixedSizeList>
      </Paper>
    );
  };

  return (
    <Grid container spacing={4} className={classes.wrapper}>
      {metadata && <PlaylistHeader />}
      {flexIndex && (
        <Grid container item className={classes.bar} spacing={2}>
          <Grid item>
            <Button
              color="secondary"
              variant="contained"
              onClick={() =>
                window.open(
                  "https://youtube.com/playlist?list=" + metadata.id,
                  "_blank"
                )
              }
            >
              Play on YouTube
            </Button>
          </Grid>

          <Grid item>
            <TextField
              id="outlined-basic"
              label="Search Subtitles"
              variant="outlined"
              size="small"
              fullWidth
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Grid>
        </Grid>
      )}
      {flexResults && <FlexResults />}
      {flexResults && flexResults.length === 0 && (
        <Grid item>
          <Typography variant="subtitle1" color="textSecondary">
            No results :(
          </Typography>
        </Grid>
      )}
      {!flexIndex && (
        <>
          <Grid item>
            <CircleLoader />
          </Grid>
          <Grid item>
            <Typography variant="subtitle1" color="textSecondary">
              Building subtitle index
            </Typography>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default PlaylistExplorer;
