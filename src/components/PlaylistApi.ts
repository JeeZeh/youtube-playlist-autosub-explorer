import { PlaylistMetadata } from "../../server";
import { PlaylistJSON } from "../../ytdl";

const host = "http://localhost:6060";
const PLAYLIST_METADATA = "playlist_metadata";
const PLAYLIST = "playlist";
const DOWNLOAD = "download";

export const getPlaylistMetadata = async (): Promise<PlaylistMetadata[]> => {
  return await (await fetch(`${host}/${PLAYLIST_METADATA}`)).json();
};

export const getPlaylist = async (id: string): Promise<PlaylistJSON> => {
  return await (await fetch(`${host}/${PLAYLIST}/${id}`)).json();
};

export const downloadPlaylist = async (id: string): Promise<string | any> => {
  return await (
    await fetch(`${host}/${DOWNLOAD}?id=${id}`, { method: "POST" })
  ).json();
};
