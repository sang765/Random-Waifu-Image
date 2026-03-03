# 🌸 Random Waifu Discord

Send random anime images from multiple sources ([waifu.im](https://waifu.im), [nekosapi.com](https://nekosapi.com), [waifu.pics](https://waifu.pics), [pic.re](https://pic.re), [nekos.best](https://nekos.best)) to Discord channels via webhooks.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🖼️ **5 Image Sources** - Fetches from waifu.im, nekosapi.com, waifu.pics, pic.re, and nekos.best
- 🔒 **SFW/NSFW Support** - Separate webhooks for SFW and NSFW content
- 🏷️ **Tag Filtering** - Filter images by specific tags (varies by source)
- ⏰ **Scheduling** - Automated posting via cron jobs or GitHub Actions
- 🖥️ **CLI Interface** - Easy-to-use command line interface
- 📝 **Rich Embeds** - Discord embeds with artist credits, source links, and resolution info
- 🔄 **Fallback Mechanism** - Automatically switches sources if one fails
- 🎭 **Webhook Profiles** - Source-specific webhook usernames and avatars for all sources

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- Discord webhooks (see [Setup Discord Webhooks](#setup-discord-webhooks))

### Installation

```bash
# Clone the repository
git clone https://github.com/sang765/Random-Waifu-Image.git
cd random-waifu-discord

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your Discord webhook URLs:
```env
SFW_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_SFW_ID/YOUR_SFW_TOKEN
NSFW_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_NSFW_ID/YOUR_NSFW_TOKEN
DEFAULT_TAGS=waifu,maid
POST_SFW=true
POST_NSFW=false
```

### Usage

#### CLI Commands

```bash
# Post SFW image (uses env config)
npm start

# Post NSFW image
npm start -- --nsfw

# Post both SFW and NSFW
npm start -- --sfw --nsfw

# Post with specific tags
npm start -- --tags "waifu,maid"

# Use specific source
npm start -- --source nekos.best
npm start -- --source waifu.pics
npm start -- --source pic.re
npm start -- --source nekosapi

# Random source selection
npm start -- --source random

# Dry run (fetch but don't post)
npm start -- --dry-run

# Show help
npm start -- --help
```

#### Scheduler Mode

Run the scheduler for automatic posting:

```bash
# Uses CRON_SCHEDULE from .env (default: every 6 hours)
npm run schedule
```

## 🎛️ Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `SFW_WEBHOOK_URL` | Discord webhook URL for SFW channel | (required) |
| `NSFW_WEBHOOK_URL` | Discord webhook URL for NSFW channel | (required) |
| `IMAGE_SOURCE` | Image source: waifu.im, nekosapi, waifu.pics, pic.re, nekos.best, both, random | `random` |
| `DEFAULT_TAGS` | Comma-separated tags to filter by | (empty) |
| `CRON_SCHEDULE` | Cron expression for scheduling | `0 */6 * * *` |
| `POST_SFW` | Enable SFW posting | `true` |
| `POST_NSFW` | Enable NSFW posting | `false` |
| `FETCH_LIMIT` | Number of images per request (1-30) | `1` |

### Cron Schedule Examples

- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 */12 * * *` - Every 12 hours
- `0 0,12 * * *` - At midnight and noon

## 🐙 GitHub Actions

This project includes GitHub Actions workflows for automated posting:

### Setup

1. Fork/clone this repository to GitHub
2. Go to **Settings > Secrets and variables > Actions**
3. Add your webhook URLs as **Repository secrets**:
   - `SFW_WEBHOOK_URL`
   - `NSFW_WEBHOOK_URL`
   - `PAT` - Personal Access Token for keep-alive (see below)
4. Add configuration as **Repository variables**:
   - `POST_SFW`: `true` or `false`
   - `POST_NSFW`: `true` or `false`
   - `DEFAULT_TAGS`: e.g., `waifu,maid`
   - `IMAGE_SOURCE`: e.g., `random`, `waifu.im`, `nekos.best`

### Keep Alive (PAT Token)

GitHub disables scheduled workflows after 60 days of repository inactivity. To prevent this:

1. Create a Personal Access Token (PAT):
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
2. Add the PAT as a repository secret named `PAT`
3. The workflow will automatically update a `.last-run` file on each run, keeping the repository "active"

> **Note:** Without the PAT, scheduled workflows may be disabled by GitHub after 60 days of inactivity.

### Workflows

- **Scheduled Post** (`.github/workflows/scheduled-post.yml`)
  - Runs automatically every 6 hours
  - Can be triggered manually from Actions tab

- **Manual Dispatch** (`.github/workflows/manual-dispatch.yml`)
  - Trigger from Actions tab with custom options
  - Choose SFW/NSFW, tags, image source, and dry-run mode

## 🖼️ Image Sources

The bot supports multiple anime image APIs. Choose your source via the `IMAGE_SOURCE` environment variable or `--source` CLI option.

| Source | API | Features | NSFW | Content Types |
|--------|-----|----------|------|---------------|
| `waifu.im` | [waifu.im](https://waifu.im) | 100K+ images, artist credits, dominant color | ✅ Yes | Static images |
| `nekosapi` | [nekosapi.com](https://nekosapi.com) | Character & artist data, ratings | ✅ Yes | Static images |
| `waifu.pics` | [waifu.pics](https://waifu.pics) | Action categories (hug, kiss, etc.) | ✅ Yes | Static images |
| `pic.re` | [pic.re](https://pic.re) | 66K+ images, AI-filtered SFW only | ❌ No | Static images |
| `nekos.best` | [nekos.best](https://nekos.best) | GIF reactions, image categories | ❌ No | Images & GIFs |
| `both` / `random` | - | Randomly selects from all sources | ✅ Yes* | Mixed |

*Pic.re and nekos.best are always SFW regardless of this setting

### Source Selection Examples

```bash
# Use specific source
npm start -- --source pic.re
npm start -- --source nekos.best

# Use random source selection
npm start -- --source random

# From .env
IMAGE_SOURCE=nekos.best
```

## 🏷️ Available Tags

Tags vary by source. Here are the available tags for each:

### waifu.im Tags
Popular tags include:
- `waifu` - Classic waifu characters
- `maid` - Maid outfits
- `marin-kitagawa` - Marin from My Dress-Up Darling
- `raiden-shogun` - Raiden from Genshin Impact
- `oppai` - Large-breasted characters
- `selfies` - Selfie-style images
- `uniform` - Uniform outfits
- `mori-calliope` - Calliope from Hololive
- `hentai`, `ecchi`, `ero` - NSFW tags

See all available tags: `curl https://api.waifu.im/tags`

### nekosapi Tags
- Character tags: `girl`, `boy`
- Hair tags: `blonde_hair`, `blue_hair`, `brown_hair`, `green_hair`, `pink_hair`, `purple_hair`, `red_hair`, `white_hair`, `long_hair`, `short_hair`, `animal_ears`
- Eye tags: `blue_eyes`, `brown_eyes`, `green_eyes`, `purple_eyes`, `red_eyes`, `yellow_eyes`
- NSFW uses `rating=explicit` parameter

### waifu.pics Categories
- **SFW**: `waifu`, `neko`, `shinobu`, `megumin`, `bully`, `cuddle`, `cry`, `hug`, `awoo`, `kiss`, `lick`, `pat`, `smug`, `bonk`, `yeet`, `blush`, `smile`, `wave`, `highfive`, `handhold`, `nom`, `bite`, `glomp`, `slap`, `kill`, `kick`, `happy`, `wink`, `poke`, `dance`, `cringe`
- **NSFW**: `waifu`, `neko`, `trap`, `blowjob`

### pic.re Tags (SFW only)
- Hair: `long_hair`, `short_hair`, `blonde_hair`, `blue_hair`, `brown_hair`, `green_hair`, `pink_hair`, `purple_hair`, `red_hair`, `white_hair`, `black_hair`
- Eyes: `blue_eyes`, `brown_eyes`, `green_eyes`, `purple_eyes`, `red_eyes`, `yellow_eyes`
- Other: `girl`, `boy`, `original`, `blush`, `smile`, `open_mouth`, `ahoge`, `animal_ears`, `bangs`, `breasts`, `uniform`, `school_uniform`

### nekos.best Categories (SFW only)
- **Image categories**: `neko`, `waifu`, `husbando`, `kitsune`
- **GIF reactions**: `hug`, `kiss`, `cuddle`, `pat`, `poke`, `tickle`, `slap`, `bonk`, `wave`, `wink`, `smile`, `blush`, `cry`, `happy`, `sleep`, `dance`, `kick`, `punch`, `shoot`, `stare`, `think`, `confused`, `angry`, `baka`, `bite`, `blowkiss`, `clap`, `facepalm`, `feed`, `handhold`, `handshake`, `highfive`, `laugh`, `lurk`, `nod`, `nom`, `nope`, `peck`, `pout`, `run`, `salute`, `shrug`, `sip`, `smug`, `spin`, `tableflip`, `teehee`, `thumbsup`, `wag`, `yawn`, `yeet`, `shocked`, `bleh`, `bored`, `nya`, `lappillow`, `carry`, `kabedon`, `shake`

## 🛠️ Development

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint
```

## 📁 Project Structure

```
random-waifu-discord/
├── .github/
│   └── workflows/
│       ├── scheduled-post.yml    # Automated posting workflow
│       └── manual-dispatch.yml   # Manual trigger workflow
├── src/
│   ├── clients/
│   │   ├── waifu-client.ts       # waifu.im API integration
│   │   ├── nekos-client.ts       # nekosapi.com API integration
│   │   ├── waifu-pics-client.ts  # waifu.pics API integration
│   │   ├── picre-client.ts       # pic.re API integration
│   │   ├── nekos-best-client.ts  # nekos.best API integration
│   │   └── discord-webhook.ts    # Discord webhook sender
│   ├── types/
│   │   ├── waifu.ts              # waifu.im types
│   │   ├── nekos.ts              # nekosapi.com types
│   │   ├── waifupics.ts          # waifu.pics types
│   │   ├── picre.ts              # pic.re types
│   │   ├── nekosbest.ts          # nekos.best types
│   │   └── source.ts             # Unified source interface
│   ├── utils/
│   │   └── config.ts             # Environment config & tags
│   ├── main.ts                   # CLI entry point
│   └── scheduler.ts              # Cron scheduler
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Setup Discord Webhooks

1. Open Discord and go to your server
2. Navigate to the channel where you want to post images
3. Click **Settings** (gear icon) next to the channel name
4. Go to **Integrations > Webhooks**
5. Click **New Webhook**
6. Give it a name (e.g., "Waifu Bot")
7. Copy the webhook URL
8. Paste it in your `.env` file

Repeat for NSFW channel if desired.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔄 Changelog

### Recent Updates
- **Added**: nekos.best support with 60+ GIF reaction categories
- **Added**: Source-specific webhook profiles (usernames and avatars)
- **Fixed**: NekosAPI tag filtering now works correctly
- **Fixed**: Resolution display in Discord embeds
- **Improved**: Fallback mechanism when sources fail
