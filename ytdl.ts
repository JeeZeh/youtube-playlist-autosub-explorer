import * as Youtubedl from "youtube-dl";
import * as fs from "fs";
const vttJson = require("vtt-json");
const playlistDataLocation = "./playlist_data/";
const temp = "./temp/";

interface PlaylistUpdates {
  added: Set<string>;
  removed: Set<string>;
}

export interface PlaylistJSON {
  id: string;
  videos: Videos;
  subs: Subtitles;
}

interface SubsPromise {
  id: string;
  convertedJsonSubtitle: any;
  error: any;
}

interface MetadataPromise {
  id: string;
  error: any;
  meta?: VideoInfo;
}

export interface Videos {
  [key: string]: VideoInfo;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  date: string;
  duration: number;
}

export interface SubtitlePart {
  start: number;
  end: number;
  part: string;
}

export interface Subtitles {
  [key: string]: SubtitlePart[];
}

/**
 * Returns an array of video ids for all videos in a playlist
 * @param playlist {string} playlist url
 */
const getVideoIds = (playlist: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    Youtubedl.exec(
      playlist,
      ["-i", "--flat-playlist", "--skip-download", "--get-id"],
      {},
      (err, output) => {
        if (err) reject(err);
        else {
          console.log("  Retrieved YouTube IDs for", output.length, "videos");
          resolve(output);
        }
      }
    );
  });
};

/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} array to split
 * @param chunk_size {Integer} Size of every group
 */
const chunkArray = (myArray: any[], chunk_size: number): any[][] => {
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    const chunk = myArray.slice(index, index + chunk_size);
    tempArray.push(chunk);
  }

  return tempArray;
};

const logTitle = (message: string) => {
  const border = Array.from({ length: message.length }, (_) => "-").join("");
  console.log(`\n${border}\n${message}\n${border}\n`);
};

/**
 * Very naive function to extract id from potential url
 * @param id potential ID/URL/etc.
 */
const cleanPlaylistId = (potentialUrl: string): string => {
  if (potentialUrl.includes("list=")) {
    let id = new URL(potentialUrl).searchParams.get("list") ?? "unknown_id";
    if (id === "unknown_id") {
      console.error("\n!!WARNING!!");
      console.error(
        "Playlist ID unknown. Data will be saved (OR OVERWRITTEN) to 'unknown_id.json'"
      );
    }
    return id;
  } else if (potentialUrl.includes("v=") || potentialUrl.includes("watch")) {
    throw new Error("YouTube video provided, please provide a playlist");
  } else {
    return potentialUrl;
  }
};

/**
 * Naive, and SLOW, subtitle cleaning. Attempts to remove subtitles where a SubtitlePart
 * appears in entirety either before or after it. Also removes empty subtitle parts.
 * @param subsJson
 */
const cleanSubtitles = (subsJson: SubtitlePart[]): SubtitlePart[] => {
  const passEmptySubs = subsJson.filter((sub) => {
    return sub.part.trim() !== "";
  });
  const passForward = passEmptySubs.filter((sub, i) => {
    if (i < passEmptySubs.length - 1) {
      return !passEmptySubs[i + 1].part.includes(sub.part);
    }
    return true;
  });
  const passBackward = passForward.filter((sub, i) => {
    if (i > 0) {
      return !passForward[i - 1].part.includes(sub.part);
    }
    return true;
  });
  return passBackward;
};

const checkExistingPlaylistData = async (
  playlistId: string
): Promise<PlaylistJSON> => {
  const playlistData: PlaylistJSON = { id: playlistId, videos: {}, subs: {} };
  try {
    const fileData: PlaylistJSON = await JSON.parse(
      fs.readFileSync(`${playlistDataLocation}${playlistId}.json`, "utf8")
    );
    console.log("  Existing playlist data found");
    if (fileData.videos && Object.keys(fileData.videos).length > 0)
      playlistData.videos = fileData.videos;
    if (fileData.subs && Object.keys(fileData.subs).length > 0)
      playlistData.subs = fileData.subs;
  } catch (e) {
    console.log("  Existing playlist data not found");
  }

  return playlistData;
};

const createVideoInfoFromYtdlOutput = (output: any): VideoInfo => {
  const { title, description, thumbnail, upload_date, duration, id } = output;
  return {
    id,
    title,
    description,
    thumbnail,
    date: upload_date,
    duration,
  };
};

const safeBatchYtdlInfo = async (ids: string[]): Promise<Videos> => {
  const grabInfo = (ids: string[]): Promise<Videos> => {
    return new Promise((resolve, reject) => {
      Youtubedl.getInfo(
        // @ts-expect-error
        ids,
        ["-i", "--skip-download", "--print-json"],
        {},
        async (err, data: Youtubedl.Info[]) => {
          try {
            let needsParse = false;
            let dataArray;
            if (data) dataArray = Array.from(data);
            else if (err) {
              dataArray = err.stdout.split(/\r\n|\r|\n/);
              needsParse = true;
            }
            // @ts-expect-error
            dataArray = dataArray.filter((d) => (needsParse && d !== "") || d);
            let output: Videos = {};
            for (let i = 0; i < dataArray.length; i++) {
              let toProcess = needsParse
                ? await JSON.parse(dataArray[i])
                : dataArray[i];
              output[toProcess.id] = createVideoInfoFromYtdlOutput(toProcess);
            }

            resolve(output);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  };

  if (ids.length > 300) {
    console.log("This might take a while, please be patient");
  }

  const promiseBucket: Promise<Videos>[] = [];
  const idBatches: string[][] = chunkArray(ids, Math.ceil(ids.length / 20));
  console.log("Downloading video info using", idBatches.length, "batches");

  for (const batch of idBatches) {
    promiseBucket.push(
      grabInfo(batch).then((v) => {
        console.log("  Batch of", batch.length, "video(s) retrieved");
        return v;
      })
    );
  }

  let videos: Videos = {};

  videos = Object.assign({}, ...(await Promise.all(promiseBucket)));

  if (Object.keys(videos).length !== ids.length) {
    console.warn(
      `Some videos couldn't be accessed for indexing (${
        ids.length - Object.keys(videos).length
      })`
    );
    ids
      .filter((id) => !videos.hasOwnProperty(id))
      .forEach((id) => console.warn(`  ${id}`));
  }

  return videos;
};

/**
 * Batch subtitle downloading in a way that tries to handle errors from Ytdl process without losing
 * any successfully downloaded data.
 * @param ids
 */
const safeBatchYtdlSubs = async (ids: string[]): Promise<Subtitles> => {
  const grabSubs = (ids: string[]): Promise<Subtitles> => {
    return new Promise((resolve, reject) => {
      Youtubedl.exec(
        // @ts-expect-error
        ids,
        [
          "--write-auto-sub",
          "-i",
          "--skip-download",
          "--no-warnings",
          "--sub-lang=en",
          "--sub-format=vtt",
        ],
        { cwd: temp },
        async (err, output) => {
          const subFiles = fs.readdirSync(temp);
          const idFiles: { id: string; file: string }[] = [];
          ids.forEach((id) =>
            subFiles.forEach((file) => {
              if (file.includes(id)) {
                idFiles.push({ id, file: `${temp}/${file}` });
              }
            })
          );

          const subtitles: Subtitles = {};
          for (const { id, file } of idFiles) {
            const vtt = fs.readFileSync(file).toString();
            fs.unlinkSync(file); // Delete sub file after
            subtitles[id] = cleanSubtitles(await vttJson(vtt));
          }

          resolve(subtitles);
        }
      );
    });
  };

  fs.mkdirSync(temp, { recursive: true });
  fs.readdirSync(temp).forEach((f) => fs.unlinkSync(temp + f));
  if (ids.length > 600) {
    console.log("This might take a while, please be patient");
  }
  const promiseBucket: Promise<Subtitles>[] = [];
  const idBatches = chunkArray(ids, Math.ceil(ids.length / 12));
  console.log("Downloading subtitles info using", idBatches.length, "batches");

  for (const batch of idBatches) {
    promiseBucket.push(
      grabSubs(batch).then((v) => {
        console.log("  Batch of", batch.length, "subtitles(s) retrieved");
        return v;
      })
    );
  }
  let subtitles: Subtitles = {};

  subtitles = Object.assign({}, ...(await Promise.all(promiseBucket)));

  if (Object.keys(subtitles).length !== ids.length) {
    console.warn(
      `Subtitles not available for the following videos (${
        ids.length - Object.keys(subtitles).length
      })`
    );
    ids
      .filter((id) => !subtitles.hasOwnProperty(id))
      .forEach((id) => console.warn(`  ${id}`));
  }

  return subtitles;
};

/**
 * Checks for updates to current playlist data.
 * Assumes videos ids and subs ids will be the same
 * @param playlistData {PlaylistJSON} Current playlist data
 */
const checkForPlaylistDataUpdates = async (
  playlistData: PlaylistJSON
): Promise<PlaylistUpdates> => {
  const freshIds = new Set(await getVideoIds(playlistData.id));
  const currentIds = new Set(Object.keys(playlistData.videos));
  // Check for differences in data
  const added = new Set([...freshIds].filter((x) => !currentIds.has(x)));
  const removed = new Set([...currentIds].filter((x) => !freshIds.has(x)));

  return { added, removed };
};

/**
 * Main wrapper for program. The wrapper will handle downloading and updating any playlist provided.
 * @param playlistId {string} Either playlist ID or URL
 */
export const YtdlPlaylistDownloader = async (playlistId: string) => {
  playlistId = cleanPlaylistId(playlistId);
  console.log("  Processing playlist:", playlistId);
  let playlist = await checkExistingPlaylistData(playlistId);
  const { added, removed } = await checkForPlaylistDataUpdates(playlist);
  const updateNeeded = added.size + removed.size > 0;
  if (updateNeeded) {
    logTitle("Playlist changes detected");
  }

  if (removed.size) {
    console.log(
      `Removing ${removed.size} video${
        removed.size > 1 ? "s" : ""
      } from playlist data`
    );
    playlist.videos = Object.keys(playlist.videos)
      .filter((id) => !removed.has(id))
      .reduce((obj, key) => {
        return {
          ...obj,
          [key]: playlist.videos[key],
        };
      }, {});

    playlist.subs = Object.keys(playlist.subs)
      .filter((id) => !removed.has(id))
      .reduce((obj, key) => {
        return {
          ...obj,
          [key]: playlist.subs[key],
        };
      }, {});
  }

  if (added.size) {
    console.log(
      `  Adding ${added.size} video${
        added.size > 1 ? "s" : ""
      } to playlist data`
    );
    logTitle("Downloading playlist metadata updates");
    const newMetadata = await safeBatchYtdlInfo([...added]);

    logTitle("Downloading playlist subtitle updates");
    const newSubtitles = await safeBatchYtdlSubs([...added]);
    playlist.videos = { ...playlist.videos, ...newMetadata };
    playlist.subs = { ...playlist.subs, ...newSubtitles };
  }

  if (updateNeeded) {
    logTitle("Playlist data updated. Rewriting database file...");
    try {
      fs.mkdirSync(playlistDataLocation, { recursive: true });
      fs.writeFileSync(
        `${playlistDataLocation}${playlistId}.json`,
        JSON.stringify(playlist)
      );
      console.log("Done!");
    } catch (error) {
      console.error("Error writing playlist data to file\n", error);
    }
  } else {
    logTitle("Done! No changes made to playlist data.");
  }
  logTitle("                                               ");
};

const main = async () => {
  logTitle("YouTube Playlist Autosub Downloader");

  const playlists = process.argv.slice(
    process.argv.findIndex((arg) => arg === "--") + 1
  );

  if (playlists.length === 0)
    console.error(
      "No playlists provided. Use the command like:\n\nnpm run ytdl [playlist_id/url] [playlist_id/url] etc.\n"
    );
  else {
    console.log("Found the following playlists to try download", playlists);

    for (const playlist of playlists) {
      await YtdlPlaylistDownloader(playlist).catch((e) =>
        console.error("Playlist download failed for", playlist, e)
      );
    }
  }
};

main();
