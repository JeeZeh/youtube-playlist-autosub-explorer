import { PlaylistJSON, YtdlPlaylistDownloader } from "./ytdl";
import express from "express";
import * as fs from "fs";
import humanizeDuration from "humanize-duration";
import cors from "cors";
import md5 from "object-hash";
const app = express();
const port = 6060; // default port to listen
const playlistDirectory = "./playlist_data";
const playlists = new Map<string, PlaylistJSON>();
const playlistHashes = new Map<string, string>();
const playlistMetadata = new Map<string, PlaylistMetadata>();
let ytdlSingleton = false;

app.use(cors(), express.static("dist", {}));

const generateMetadata = async (playlistData: PlaylistJSON) => {
  if (Object.keys(playlistData.videos).length === 0) return false;
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

  return true;
};

const initPlaylistData = async () => {
  fs.mkdirSync(playlistDirectory, { recursive: true });
  const dir: string[] = fs.readdirSync(playlistDirectory);
  const metadataPromise = [];
  for (const filename of dir) {
    const playlistData: PlaylistJSON = await JSON.parse(
      fs.readFileSync(playlistDirectory + "/" + filename, "utf-8")
    );
    metadataPromise.push(generateMetadata(playlistData));
    playlistHashes.set(filename.split(".json")[0], md5(playlistData.videos));
    playlists.set(filename.split(".json")[0], playlistData);
  }
  await Promise.all(metadataPromise);
};

const checkUpdates = async (id?: string) => {
  let toUpdate: PlaylistJSON[] = [];
  let data;
  if (id) {
    const filename = id + ".json";
    try {
      data = await JSON.parse(
        fs.readFileSync(playlistDirectory + "/" + filename, "utf-8")
      );
    } catch (e) {
      console.error(e);
      return false;
    }

    if (md5(data.videos) !== playlistHashes.get(filename)) {
      playlists.set(filename, data);
      toUpdate.push(data);
    }
  } else {
    const playlistDir = fs.readdirSync(playlistDirectory);
    const readAsync = playlistDir.map((f) =>
      JSON.parse(fs.readFileSync(playlistDirectory + "/" + f, "utf-8"))
    );
    await Promise.all(readAsync);
    for (const file of playlistDir) {
      let data = readAsync.find((d) => file === d.id + ".json");
      const filename = file.split(".json")[0];
      const hash = playlistHashes.get(filename);
      if (!hash || md5(data.videos) !== hash) {
        playlists.set(filename, data);
        toUpdate.push(data);
      }
    }
    for (const playlist of playlists.keys()) {
      if (!playlistDir.includes(playlist + ".json")) {
        playlists.delete(playlist);
        playlistMetadata.delete(playlist);
        playlistHashes.delete(playlist);
      }
    }
  }

  if (toUpdate.length !== 0) {
    const metadataPromise: Promise<boolean>[] = [];
    toUpdate.forEach((data) => {
      metadataPromise.push(generateMetadata(data));
    });
    await Promise.all(metadataPromise);
  }
  return true;
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
    checkUpdates()
      .then(() => res.json([...playlistMetadata.values()]))
      .catch((e) => res.status(500).send(e));
  });

  app.get("/playlist/:id", (req, res) => {
    const { id } = req.params;
    if (!playlists.has(id)) {
      res.status(404).send();
      return;
    }
    const playlist = playlists.get(id);

    if (!playlist) {
      res.status(500).send();
      return;
    }
    res.json(playlist);
  });

  app.post("/download", (req, res) => {
    const id = req.query.id;
    if (typeof id !== "string") {
      res.status(400).send("Please provide a single ID string");
      return;
    }
    if (ytdlSingleton)
      return res.status(400).json({
        success: false,
        message: "Ytdl download already in progress",
      });
    ytdlSingleton = true;
    YtdlPlaylistDownloader(id)
      .then((playlistId) => {
        if (playlistId) {
          res.json({ success: true, message: playlistId });
        } else {
          res.status(500).json({
            success: false,
            message: "Downloading failed, check server output",
          });
        }
      })
      .catch((e) => {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Downloading failed, check server output",
          error: e,
        });
      })
      .finally(() => (ytdlSingleton = false));
  });
};

initPlaylistData()
  .then(initRoutes)
  .then(() => {
    app.listen(port, () => {
      console.log(`server started at http://localhost:${port}`);
    });
  });

// start the express server
