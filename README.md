# NavAlong

> A real-time group navigation app built with React Native & Expo. Create or join a room, share a destination, and drive together — with live member tracking, turn-by-turn directions, and in-car voice chat.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Screen Map](#screen-map)
- [Component Breakdown](#component-breakdown)
- [Data Flow](#data-flow)
- [Tech Stack & Resources](#tech-stack--resources)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Realtime & Broadcasting](#realtime--broadcasting)
- [Voice Chat (Agora)](#voice-chat-agora)
- [Getting Started](#getting-started)

---

## Overview

NavAlong lets a group of drivers coordinate in real time. One person creates a room, shares a code, and everyone else joins. The host sets a destination — all members see it on their map, get turn-by-turn directions, and can see each other's live positions, ETAs, and speeds. An optional push-to-talk voice channel keeps the group connected without needing a phone call.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Native App                    │
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │  Login   │──▶│  CreateRoom  │──▶│  LocationScreen │ │
│  └──────────┘   └──────────────┘   └────────┬────────┘ │
│                                             │           │
│                        ┌────────────────────┼──────┐    │
│                        │    UI Components   │      │    │
│                        │  ┌─────────────┐  │      │    │
│                        │  │  SearchBar  │  │      │    │
│                        │  │  NavPanel   │  │      │    │
│                        │  │  DestPanel  │  │      │    │
│                        │  │ MemberList  │  │      │    │
│                        │  │MemberMarker │  │      │    │
│                        │  │  RoomAudio  │  │      │    │
│                        │  │   Loading   │  │      │    │
│                        │  └─────────────┘  │      │    │
│                        └───────────────────┘      │    │
└───────────────────────────────────────────────────┼────┘
                                                    │
          ┌─────────────────────────────────────────┤
          │                                         │
          ▼                                         ▼
  ┌───────────────┐                      ┌──────────────────┐
  │   Supabase    │                      │   Agora RTC      │
  │               │                      │                  │
  │ ┌───────────┐ │                      │  Voice channel   │
  │ │   Auth    │ │                      │  per room ID     │
  │ └───────────┘ │                      └──────────────────┘
  │ ┌───────────┐ │
  │ │  Database │ │                      ┌──────────────────┐
  │ │ profiles  │ │                      │  Google Maps     │
  │ │  rooms    │ │                      │                  │
  │ │room_member│ │                      │  Places API      │
  │ └───────────┘ │                      │  Directions API  │
  │ ┌───────────┐ │                      └──────────────────┘
  │ │ Realtime  │ │
  │ │ Broadcast │ │
  │ │(location/ │ │
  │ │ dest sync)│ │
  │ └───────────┘ │
  └───────────────┘
```

---

## Screen Map

```
App.js (NavigationContainer)
│
├── Login              (/Screen/Login.js)
│     Sign in / Sign up via Supabase Auth
│     Navigates → locationScreen (with userId)
│
├── CreateRoom         (/Screen/CreateRoom.js)
│     Create a new room (generates short_code)
│     Join an existing room by code
│     Navigates → locationScreen (with roomId, roomCode, groupName, userId, isHost)
│
└── locationScreen     (/Screen/LocationScreen.js)
      Main map screen — renders all sub-components
      Manages all state: location, destination, room, navigation
```

---

## Component Breakdown

### `LocationScreen.js` — Central State Hub
The root of the map experience. Owns all shared state and passes it down as props.

| State | Purpose |
|---|---|
| `location` | User's live GPS coords from `expo-location` |
| `destination` | Lat/lng of selected destination |
| `destLabel` | Human-readable destination name |
| `isNavigating` | Whether turn-by-turn mode is active |
| `members` | Realtime map of `{ userId: { lat, lng, heading, speed } }` |
| `steps / stepIndex` | Turn-by-turn instruction array from Directions API |
| `distance / duration` | Route summary from MapViewDirections |

---

### `SearchBar.js`
- Google Places Autocomplete input (floating above map)
- Host-only editing: `textInputProps.editable` is locked for non-host members in a room
- Broadcasts destination to all room members via Supabase Realtime when host selects
- Shows **End Room** (host) or **Leave Room** (member) button when in a room
- Shows **Create/Join Room** button when not in a room

---

### `DestinationPanal.js`
- Appears at the bottom when a destination is selected
- Shows destination name, distance, and ETA
- **Navigate** button starts turn-by-turn and triggers `animateDriving()`
- **Stop** button ends navigation and recentres the map
- **Clear** (×) resets all destination state

---

### `NavigationPanal.js`
- Appears at the top when actively navigating
- Renders current step instruction with a direction icon
- Previews the next step below a divider
- `getDirectionIcon(maneuver)` maps Google maneuver strings to MaterialCommunityIcons
- `stripHtml()` cleans `<b>` and `<div>` tags from Google's HTML instructions

---

### `MemberList.js`
- Bottom sheet listing all room members
- Merges Supabase profile data with live Realtime positions
- Calculates haversine distance and ETA for each member to the shared destination
- Shows navigating/stopped status dot per member
- Displays room code in the footer (selectable for copying)

---

### `MemberMarker.js`
- Renders one `<Marker>` per remote member on the MapView
- Uses `heading` for rotation so the car icon points in their direction of travel
- Orange circular marker with a car icon to distinguish from the user's own marker

---

### `RoomAudio.js`
- Agora RTC engine setup: audio-only, `LiveBroadcasting` profile, `Broadcaster` role
- Joins the Agora channel using `roomId` as the channel name
- Starts muted by default — push-to-talk via the mic button
- Tracks member count from `onUserJoined` / `onUserOffline` events
- Cleans up engine on unmount (`leaveChannel` + `release`)

---

### `Loading.js`
- Simple overlay shown while GPS location is being acquired
- Renders over the full screen with a card and icon

---

## Data Flow

### Location broadcast (every position update)
```
User moves
  → expo-location watchPositionAsync fires
    → LocationScreen updates local `location` state
      → Supabase Realtime channel.track({ lat, lng, heading, speed })
        → All other members receive via presence sync
          → MemberMarker re-renders with new position
          → MemberList recalculates distance & ETA
```

### Host sets destination
```
Host selects place in SearchBar
  → setDestination + setDestLabel called locally
    → broadcastDestination(channel, userId, destination, label)
      → Supabase Realtime broadcast event "destination"
        → All members receive event
          → Their setDestination + setDestLabel updated
            → DestinationPanal appears for all members
```

### Member joins active room
```
Member enters room code in CreateRoom
  → joinRoom(code, userId) — inserts into room_members table
    → navigate to locationScreen with roomId, roomCode, isHost: false
      → LocationScreen subscribes to Supabase Realtime channel
        → [TODO] fetch stored destination from rooms table on join
```

---

## Tech Stack & Resources

### Core Framework
| Library | Version | Purpose | Docs |
|---|---|---|---|
| React Native | 0.74+ | Cross-platform mobile framework | https://reactnative.dev/docs/getting-started |
| Expo | SDK 51 | Build toolchain, managed workflow | https://docs.expo.dev |
| Expo Go | — | Development client for testing | https://docs.expo.dev/get-started/expo-go |

---

### Navigation
| Library | Purpose | Docs |
|---|---|---|
| `@react-navigation/native` | Navigation container & hooks | https://reactnavigation.org/docs/getting-started |
| `@react-navigation/native-stack` | Native stack navigator (Login → CreateRoom → LocationScreen) | https://reactnavigation.org/docs/native-stack-navigator |

---

### Maps & Location
| Library | Purpose | Docs |
|---|---|---|
| `expo-location` | `watchPositionAsync` for live GPS tracking | https://docs.expo.dev/versions/latest/sdk/location |
| `react-native-maps` | `MapView`, `Marker` components | https://github.com/react-native-maps/react-native-maps |
| `react-native-maps-directions` | `MapViewDirections` — draws route polyline, returns steps | https://github.com/bramus/react-native-maps-directions |
| Google Maps SDK | Underlying map tiles on Android | https://developers.google.com/maps/documentation/android-sdk |
| Google Places API | Destination search autocomplete | https://developers.google.com/maps/documentation/places/web-service |
| Google Directions API | Route steps, distance, duration, maneuvers | https://developers.google.com/maps/documentation/directions |
| `react-native-google-places-autocomplete` | Places text input component | https://github.com/FaridSafi/react-native-google-places-autocomplete |

---

### Backend — Supabase
| Feature | Purpose | Docs |
|---|---|---|
| Supabase Auth | Email/password sign up & sign in, UUID user management | https://supabase.com/docs/guides/auth |
| Supabase Database (Postgres) | `profiles`, `rooms`, `room_members` tables | https://supabase.com/docs/guides/database |
| Supabase Realtime — Presence | Broadcast live location of each member | https://supabase.com/docs/guides/realtime/presence |
| Supabase Realtime — Broadcast | Push destination updates from host to members | https://supabase.com/docs/guides/realtime/broadcast |
| `@supabase/supabase-js` | JS client library | https://supabase.com/docs/reference/javascript |

---

### Voice Chat
| Library | Purpose | Docs |
|---|---|---|
| `react-native-agora` | Agora RTC engine for real-time voice | https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native |
| Agora Console | App ID management, channel monitoring | https://console.agora.io |
| Agora Token Server | (Required for production) Secure token generation | https://docs.agora.io/en/video-calling/token-authentication/deploy-token-server |

---

### UI & Styling
| Library | Purpose | Docs |
|---|---|---|
| `expo-linear-gradient` | Gradient backgrounds on Login, CreateRoom | https://docs.expo.dev/versions/latest/sdk/linear-gradient |
| `@expo/vector-icons` — MaterialCommunityIcons | All icons throughout the app | https://icons.expo.fyi |
| React Native StyleSheet | Component-scoped styles | https://reactnative.dev/docs/stylesheet |

---

### Config & Environment
| Library | Purpose | Docs |
|---|---|---|
| `expo-constants` | Access `expoConfig.extra` for API keys | https://docs.expo.dev/versions/latest/sdk/constants |
| `babel-plugin-inline-dotenv` / `react-native-dotenv` | `@env` imports for `.env` variables | https://github.com/goatandsheep/react-native-dotenv |
| `app.config.js` | Dynamic config, replaces `app.json` when using env vars | https://docs.expo.dev/workflow/configuration |

---

## Environment Variables

Create a `.env` file in the project root (never commit this):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GOOGLE_MAPS_KEY=your-google-maps-api-key
AGORA_APP_ID=your-agora-app-id
```

Then in `app.config.js`:

```js
import "dotenv/config";

export default {
  expo: {
    name: "NavAlong",
    slug: "navalongr",
    extra: {
      supabaseUrl:    process.env.SUPABASE_URL,
      supabaseKey:    process.env.SUPABASE_ANON_KEY,
      googleMapsKey:  process.env.GOOGLE_MAPS_KEY,
      agoraAppId:     process.env.AGORA_APP_ID,
    },
  },
};
```

Access in code:
```js
import Constants from "expo-constants";
const { googleMapsKey } = Constants.expoConfig.extra;
```

Or via `@env` (for `react-native-dotenv`):
```js
import { GOOGLE_MAPS_KEY } from "@env";
```

---

## Project Structure

```
NavAlong/
├── App.js                        # Root — NavigationContainer + Stack screens
├── app.config.js                 # Expo config with env vars
├── .env                          # API keys (gitignored)
├── babel.config.js               # Babel config (includes reanimated plugin)
│
├── Screen/
│   ├── Login.js                  # Auth screen (sign in / sign up)
│   ├── CreateRoom.js             # Create or join a room
│   └── LocationScreen.js         # Main map screen (state hub)
│
├── components/
│   ├── searchBar.js              # Google Places input + room controls
│   ├── destinationPanal.js       # Bottom sheet — destination info + navigate button
│   ├── navigationPanal.js        # Top banner — turn-by-turn instructions
│   ├── memberList.js             # Bottom sheet — room member list with ETA
│   ├── memberMarker.js           # Map markers for remote members
│   ├── roomAudio.js              # Agora voice chat component
│   └── loading.js                # GPS loading overlay
│
├── lib/
│   ├── supabase.js               # Supabase client initialisation
│   └── roomService.js            # createRoom, joinRoom, leaveRoom, endRoom, broadcastDestination, getRoomMembers
│
├── api/
│   └── api.js                    # generateOtp and other utility API calls
│
└── assets/
    ├── icon.png                  # App icon
    └── splash.png                # Splash screen
```

---

## Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | References `auth.users.id` |
| `username` | text | Chosen at sign up |
| `display_name` | text | Same as username by default |
| `avatar_url` | text | Optional profile picture URL |

Created automatically by a Postgres trigger `handle_new_user` on `auth.users` insert.

---

### `rooms`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Auto-generated primary key |
| `short_code` | text | 8-char code derived from UUID (shared with members) |
| `group_name` | text | Set by host at creation |
| `created_by` | uuid | References `profiles.id` |
| `destination_lat` | float | Host's current destination latitude |
| `destination_lng` | float | Host's current destination longitude |
| `destination_label` | text | Human-readable destination name |
| `created_at` | timestamp | Auto |

---

### `room_members`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Auto-generated |
| `room_id` | uuid | References `rooms.id` |
| `user_id` | uuid | References `profiles.id` |
| `joined_at` | timestamp | Auto |

---

## Realtime & Broadcasting

NavAlong uses two Supabase Realtime mechanisms:

### Presence — live location sync
Each user calls `channel.track()` every time their GPS updates:
```js
channel.track({
  latitude:  coords.latitude,
  longitude: coords.longitude,
  heading:   coords.heading,
  speed:     coords.speed,
});
```
All members receive updates via `channel.on("presence", { event: "sync" }, ...)` and the `members` state object is rebuilt from `channel.presenceState()`.

**Docs:** https://supabase.com/docs/guides/realtime/presence

### Broadcast — destination sync
When the host selects a destination:
```js
channel.send({
  type:    "broadcast",
  event:   "destination",
  payload: { destination, label, sentBy: userId },
});
```
Members receive it via `channel.on("broadcast", { event: "destination" }, handler)` and update their own map.

**Docs:** https://supabase.com/docs/guides/realtime/broadcast

---

## Voice Chat (Agora)

NavAlong uses Agora RTC for in-room push-to-talk voice:

1. Engine is created with `createAgoraRtcEngine()` and initialised with the App ID
2. Profile set to `ChannelProfileLiveBroadcasting` — supports multiple simultaneous speakers
3. Role set to `ClientRoleBroadcaster` — all members can speak and listen
4. Channel name = `roomId` (UUID) — unique per room
5. User joins muted (`muteLocalAudioStream(true)`) — tap mic button to speak
6. `autoSubscribeAudio: true` means members hear others immediately on join
7. Engine is released on component unmount to free resources

**Token note:** `AGORA_TOKEN` is currently `null` (development only). Production requires a token server — see https://docs.agora.io/en/video-calling/token-authentication/deploy-token-server

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone, or an Android/iOS emulator
- Supabase project with the schema above applied
- Google Cloud project with Maps SDK, Places API, and Directions API enabled
- Agora account with an App ID

### Install

```bash
git clone https://github.com/your-username/navalongr
cd navalongr
npm install
```

### Configure

```bash
cp .env.example .env
# Fill in your keys in .env
```

### Run

```bash
npx expo start --clear
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

### Build for production

```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

**EAS docs:** https://docs.expo.dev/build/introduction

---

## Useful Links

| Resource | URL |
|---|---|
| Expo documentation | https://docs.expo.dev |
| React Native docs | https://reactnative.dev/docs/getting-started |
| React Navigation | https://reactnavigation.org/docs/getting-started |
| Supabase docs | https://supabase.com/docs |
| Supabase Realtime | https://supabase.com/docs/guides/realtime |
| Google Maps Platform | https://developers.google.com/maps |
| Google Places API | https://developers.google.com/maps/documentation/places/web-service/overview |
| Google Directions API | https://developers.google.com/maps/documentation/directions/overview |
| react-native-maps | https://github.com/react-native-maps/react-native-maps |
| react-native-maps-directions | https://github.com/bramus/react-native-maps-directions |
| react-native-google-places-autocomplete | https://github.com/FaridSafi/react-native-google-places-autocomplete |
| Agora React Native SDK | https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native |
| Agora Token Server | https://docs.agora.io/en/video-calling/token-authentication/deploy-token-server |
| expo-linear-gradient | https://docs.expo.dev/versions/latest/sdk/linear-gradient |
| expo-location | https://docs.expo.dev/versions/latest/sdk/location |
| MaterialCommunityIcons | https://pictogrammers.com/library/mdi |
| EAS Build | https://docs.expo.dev/build/introduction |
