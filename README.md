# YouTube Playlist Autosub Explorer

## What is it?

A tool for downloading and exploring YouTube's auto-captions for playlists/channels etc.

It's still very rough, everything runs as a dev build/server, and only surface level optimisation/architecture
is present. It's still enough to function though, and can handle (a little sluggishly) 2000+ video playlists 
with at least a couple months of dialogue.

## How does it work?

Using `youtube-dl`, playlist information is downloaded and auto-subtitle content for each video is pulled.
Subtitle content is searched and explored using basic user interface built with React.

### Playlist Page
![](https://i.vgy.me/Y3vEDW.png)

#### Exploring a Playlist's Subtitles
![](https://i.vgy.me/wiXggL.png)

#### Jumping Right to the Timestamp
![](https://i.vgy.me/S9MmxB.png)


## Why is it?

If you've ever wanted to quickly search for something that was said in a series of videos, or an entire channel, this is for you

# Installing & Running

1. Install Node.js
2. Clone the repo
3. `npm i` - inside the repo to install dependencies
4. `npm run ytdl [playlist_url] [playlist_url] ...` - Downloads playlists to be explored, wait for it to finish before moving on
5. `npm start` - Should open the UI in web browser!
6. Spam `Ctrl-C` to close I guess

# To-Do:

### Server

1. ~Pull playlist information~
1. ~Pull video information~
1. ~Pull subtitles for each video~
1. Secondary STT method for extracting subtitles
1. ~Implement basic API for front-end to access the data~
1. ~Figure out how to efficiently search for text across millions of subtitle entries~ [FlexSearch](https://github.com/nextapps-de/flexsearch)
1. Include playlist title in Ytdl
1. Refresh playlist_data folder on changes so you don't need to keep restarting the UI

### UI

1. ~Init basic React app~
1. ~API Component~
1. ~Search component~
1. ~Results page component~
1. ~Result component~
1. Video transcript explorer
