import * as React from "react";
import { useState, useEffect, useContext } from "react";
import { hot } from "react-hot-loader";
import "./../assets/scss/App.scss";
import styled from "styled-components";
import { PlaylistMetadata } from "../../server";
import { getPlaylists } from "./PlaylistApi";

const Wrapper = styled.div`
  display: flex;
  margin: auto;
  flex-direction: column;
  background: #eee;
  width: 80%;
  padding: 10px 40px;
  justify-content: center;
  max-width: 900px;
  min-width: 600px;
`;

const PlaylistEntry = styled.div`
  display: grid;
  grid-template-areas: "thumb meta";
  grid-template-columns: 300px auto;
  padding: 5px;
  margin: 10px 0;
  height: 150px;
  cursor: pointer;
`;

const Thumbnail = styled.img`
  grid-area: thumb;
  justify-self: center;
  align-self: center;
  width: auto;
  max-width: 300px;
  height: 100%;
  border-radius: 4px;
`;

const Metadata = styled.div`
  grid-area: meta;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 800px;
`;

const Subtitle = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

export const Playlists = () => {
  const [playlists, setPlaylists] = useState<PlaylistMetadata[]>();

  useEffect(() => {
    getPlaylists().then(setPlaylists);
  }, []);

  const renderPlaylist = (p: PlaylistMetadata) => {
    return (
      <PlaylistEntry
        onClick={() =>
          window.open("https://youtube.com/playlist?list=" + p.id, "_blank")
        }
      >
        <Thumbnail src={p.thumbnail}></Thumbnail>
        <Metadata>
          <Title>{p.id}</Title>
          <Subtitle>
            Videos: {p.videoCount}
            <br />
            Videos with Subs: {p.videosWithSubs}
          </Subtitle>
        </Metadata>
      </PlaylistEntry>
    );
  };

  return <Wrapper>{playlists && playlists.map(renderPlaylist)}</Wrapper>;
};
