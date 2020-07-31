import express from "express";
import path from "path";
import { PlaylistJSON } from "./ytdl";
import * as fs from "fs";
import humanizeDuration from "humanize-duration";
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

    if (Object.keys(playlistData.videos).length === 0) continue;
    let totalLength = 0;
    Object.values(playlistData.videos).forEach((v) => {
      if (v.duration) totalLength += v.duration;
    });
    const metadata: PlaylistMetadata = {
      id: playlistData.id,
      videoCount: Object.keys(playlistData.videos).length,
      videosWithSubs: Object.keys(playlistData.subs).filter(
        (s) => playlistData.subs[s].length !== 0
      ).length,
      thumbnail: Object.values(playlistData.videos)[0].thumbnail,
      totalLength: humanizeDuration(1000 * totalLength, { largest: 2 }),
    };

    playlistMetadata.set(playlistData.id, metadata);
    playlists.set(filename.split(".json")[0], playlistData);
  }
};

export interface PlaylistMetadata {
  id: string;
  videoCount: number;
  videosWithSubs: number;
  totalLength: string;
  thumbnail: string;
}

const initRoutes = async () => {
  app.get("/playlist_metadata", (req, res) => {
    res.json([...playlistMetadata.values()]);
  });

  app.get("/playlist/:id", (req, res) => {
    const { id } = req.params;

    if (!playlists.has(id)) res.status(404).send();
    const playlist = playlists.get(id);

    if (!playlist) res.status(500).send();
    res.json(playlist);
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
