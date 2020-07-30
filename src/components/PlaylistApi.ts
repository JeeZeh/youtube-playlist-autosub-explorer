import { PlaylistMetadata } from "../../server";
import { PlaylistJSON } from "../../ytdl";

const host = "http://localhost:8080";
const PLAYLIST_METADATA = "playlist_metadata";
const PLAYLIST = "playlist";

export const getPlaylistMetadata = async (): Promise<PlaylistMetadata[]> => {
  return await (await fetch(`${host}/${PLAYLIST_METADATA}`)).json();
};

export const getPlaylist = async (id: string): Promise<PlaylistJSON> => {
  return await (await fetch(`${host}/${PLAYLIST}/${id}`)).json();
};
