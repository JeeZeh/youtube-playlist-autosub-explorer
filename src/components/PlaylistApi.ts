import { PlaylistMetadata } from "../../server";

const host = "http://localhost:8080";
const PLAYLISTS = "/playlists";

export const getPlaylists = async (): Promise<PlaylistMetadata[]> => {
  return await (await fetch(host + PLAYLISTS)).json();
};
