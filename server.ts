import express from "express";
import path from "path";
import { PlaylistJSON } from "./ytdl";
import * as fs from "fs";
import cors from "cors";
const app = express();
const port = 8080; // default port to listen
const playlistDirectory = "./playlist_data";
const playlists = new Map<string, PlaylistJSON>();
const playlistMetadata = new Map<string, PlaylistMetadata>();

app.use(cors());

const initPlaylistData = async () => {
  const dir: string[] = fs.readdirSync(playlistDirectory);
  for (const filename of dir) {
    const playlistData: PlaylistJSON = await JSON.parse(
      fs.readFileSync(playlistDirectory + "/" + filename, "utf-8")
    );

    if (playlistData.videos.length === 0) continue;

    const metadata: PlaylistMetadata = {
      id: playlistData.id,
      videoCount: playlistData.videos.length,
      videosWithSubs: Object.keys(playlistData.subs).filter(
        (s) => playlistData.subs[s].length !== 0
      ).length,
      thumbnail: playlistData.videos[0].thumbnail,
    };

    playlistMetadata.set(playlistData.id, metadata);
    playlists.set(filename.split(".json")[0], playlistData);
  }
  console.log(playlistMetadata);
};

export interface PlaylistMetadata {
  id: string;
  videoCount: number;
  videosWithSubs: number;
  thumbnail: string;
}

const initRoutes = async () => {
  app.get("/playlists", (req, res) => {
    res.json([...playlistMetadata.values()]);
  });
};

initPlaylistData()
  .then(initRoutes)
  .then(() => {
    app.listen(port, () => {
      // tslint:disable-next-line:no-console
      console.log(`server started at http://localhost:${port}`);
    });
  });

// start the express server
