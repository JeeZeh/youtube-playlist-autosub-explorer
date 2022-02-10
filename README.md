![](https://github.com/JeeZeh/youtube-playlist-autosub-explorer/blob/master/YouTube%20Autosub%20Explorer.png)

# YouTube Playlist Autosub Explorer

## What is it?

A tool for downloading and exploring YouTube's auto-captions for playlists/channels etc.

It's still very rough, everything runs as a dev build/server, and only surface level optimisation/architecture
is present. It's still enough to function though, and can handle (a little sluggishly) 2000+ video playlists
with at least a couple months of dialogue.

## How does it work?

Using `youtube-dl`, playlist information is downloaded and auto-subtitle content for each video is pulled.
Subtitle content is searched and explored using basic user interface built with React.

## Why is it?

If you've ever wanted to quickly search for something that was said in a series of videos, or an entire channel, this is for you. Some use cases include:

- Searching for concepts covered in tutorial series
- Exploring ideas and concepts in debate/video essay style channels
- Find that one thing someone said in a video, but you can't remember which one
- Explore lore behind story-heavy channels

# Installing & Running

1. Install Node.js
2. Clone the repo
3. `npm i` - inside the repo to install dependencies
4. `npm run ytdl [playlist_url] [playlist_url] ...` - Downloads playlists to be explored, wait for it to finish before moving on
   1. Additionally specify `update` with `npm run ytdl` to update any existing playlist data, in addition to any new URLs provided
   2. Additionally specify `threads=x` with `npm run ytdl` to set the number of youtube-dl processes to spawn [min=1, max=100]
5. `npm start` - Should open the UI in web browser!
6. Spam `ctrl-c` to close I guess

# Caveats - these are important

> I **highly** recommend using a VPN to avoid being IP limited or banned.

1. You _must_ provide a playlist. Even if you just want one video, wrap it in a playlist!
   1. YouTube does a lot with playlists. For example, clicking "Play all" on a channel uploads will give you a playlist link. This is how you index an entire channel.
2. The subtitles are, in most cases, provided by YouTube's auto-captions, though it does download official ones if present!
3. This tool does NO speech-to-text. All captions are from YouTube, so if the subtitles say one thing, but the video says another, that's not my fault
4. This tool can make a LOT of requests to YouTube, which may result in YouTube temporarily restricting connections from your device - use it at your own discretion
5. It's clunky and buggy, and is not an enterprise-ready™ solution. As such, a lot of the implemented QoL features like updating local playlists etc. emply naive solutions which may not work well. For example, if you index a video which does not have subtitles, but then has subtitles added to it, the tool won't be aware of this.
6. If in doubt, delete the playlist and download it again!

## Some side-effects of over-using the tool

#### Potential rate limiting

<img src="https://i.vgy.me/upSb0O.png" width="450">

#### YouTube blocking connections outside of browser

<img src="https://i.vgy.me/aRqiSR.png" width="450">

# To-Do:

### Server

1. ~Pull playlist information~
1. ~Pull video information~
1. ~Pull subtitles for each video~
1. ~Implement basic API for front-end to access the data~
1. ~Secondary STT method for extracting subtitles~ - I don't want to be liable for mis-subtitling.
1. ~Figure out how to efficiently search for text across millions of subtitle entries~ [FlexSearch](https://github.com/nextapps-de/flexsearch)
1. ~Refresh playlist_data folder on changes so you don't need to keep restarting the UI~
1. Include playlist title in Ytd
1. ~Download playlists from UI~

### UI

1. ~Init basic React app~
1. ~API Component~
1. ~Search component~
1. ~Results page component~
1. ~Result component~
1. Video transcript explorer

# Images

### Playlist Page

<img src="https://i.vgy.me/Y3vEDW.png" width="600">

#### Exploring a Playlist's Subtitles

<img src="https://i.vgy.me/wiXggL.png" width="600">

#### Jumping Right to the Timestamp

<img src="https://i.vgy.me/S9MmxB.png" width="600">
