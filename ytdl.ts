import * as Youtubedl from "youtube-dl";
import * as fs from "fs";
const vttJson = require("vtt-json");
const playlistDataLocation = "./playlist_data/";

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
 * Returns a promise with information on a YouTube video with given ID
 * @param id {string} ID of the YouTube video
 */
const getInfo = (id: string): Promise<MetadataPromise> => {
  return new Promise((resolve, reject) => {
    let error: any;
    Youtubedl.getInfo(id, (err, info: any) => {
      error = err;
      if (!info) {
        resolve({ id, error });
        return;
      }
      const {
        title,
        description,
        thumbnail,
        upload_date,
        _duration_raw,
      } = info;
      resolve({
        id,
        error,
        meta: {
          id,
          title,
          description,
          thumbnail,
          date: upload_date,
          duration: _duration_raw,
        },
      });
    });
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
  const originalLength = subsJson.length;
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
  console.log(
    "Removed",
    originalLength - passBackward.length,
    "duplicate subtitles"
  );
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

const getPlaylistVideoMetadata = async (ids: string[]) => {
  const idChunks = chunkArray(ids, 5);
  const rawInfo: MetadataPromise[] = [];
  let finishedPulling = 0;

  for (const chunk of idChunks) {
    const batch = chunk.map(getInfo);
    // console.log(`Batch ${index + 1}/${idChunks.length}`);
    const promiseBlock = await Promise.all(batch);
    finishedPulling += promiseBlock.length;
    console.log(`  [${finishedPulling}/${ids.length}] processed`);

    rawInfo.push(...promiseBlock);
  }

  const successfulVideos: Videos = {};

  rawInfo.forEach((p) => {
    if (p.error) {
      console.error("Failed to download video metadata:", p.id);
    } else if (p.meta) successfulVideos[p.id] = p.meta;
  });

  return successfulVideos;
};

const getSubtitlesForVideoId = (id: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    Youtubedl.getSubs(
      id,
      { lang: "en", all: false, auto: true, cwd: __dirname },
      (err, output) => {
        if (err) reject(err);
        else {
          resolve(output);
        }
      }
    );
  });
};

const downloadAndProcessSubtitles = async (
  id: string
): Promise<SubsPromise> => {
  let convertedJsonSubtitle = [];
  let error: any;
  const videoSubs = await getSubtitlesForVideoId(id).catch((e) => (error = e));
  if (videoSubs && videoSubs.length === 1) {
    const subFile = videoSubs[0];
    const vtt = fs.readFileSync(subFile).toString();
    fs.unlinkSync(subFile); // Delete sub file after
    convertedJsonSubtitle = await vttJson(vtt);
  }
  return { id, convertedJsonSubtitle, error };
};

/**
 *
 * @param ids {string[]} Array of video IDs to pull subs from
 */
const grabSubs = async (ids: string[]) => {
  const idChunks = chunkArray(ids, 5);
  const subs: Subtitles = {};
  const promisedSubs: SubsPromise[] = [];
  let finishedPulling = 0;

  for (const chunk of idChunks) {
    const batch = chunk.map(downloadAndProcessSubtitles);
    const promiseBlock = await Promise.all(batch);
    finishedPulling += promiseBlock.length;
    console.log(`  [${finishedPulling}/${ids.length}] processed`);

    promisedSubs.push(...promiseBlock);
  }

  promisedSubs.forEach((s) => {
    const { error, id, convertedJsonSubtitle } = s;
    if (error) {
      console.error("Error downloading subs for:", id);
    } else if (Object.keys(convertedJsonSubtitle).length === 0) {
      console.log("No subs found for video:", id);
    }

    const videoSubtitles = cleanSubtitles(convertedJsonSubtitle);
    subs[id] = videoSubtitles;
  });

  return subs;
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
    const newMetadata = await getPlaylistVideoMetadata([...added]);
    logTitle("Downloading playlist subtitle updates");
    const newSubtitles = await grabSubs([...added]);
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
