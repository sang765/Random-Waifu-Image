# 🌸 Random Waifu Discord

Send random waifu images from [waifu.im](https://waifu.im) to Discord channels via webhooks.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🖼️ **Random Waifu Images** - Fetches random anime images from waifu.im API
- 🔒 **SFW/NSFW Support** - Separate webhooks for SFW and NSFW content
- 🏷️ **Tag Filtering** - Filter images by specific tags (waifu, maid, etc.)
- ⏰ **Scheduling** - Automated posting via cron jobs or GitHub Actions
- 🖥️ **CLI Interface** - Easy-to-use command line interface
- 📝 **Rich Embeds** - Discord embeds with artist credits and source links

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- Discord webhooks (see [Setup Discord Webhooks](#setup-discord-webhooks))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/random-waifu-discord.git
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
  - Choose SFW/NSFW, tags, and dry-run mode

## 🏷️ Available Tags

Popular waifu.im tags include:

- `waifu` - Classic waifu characters
- `maid` - Maid outfits
- `marin-kitagawa` - Marin from My Dress-Up Darling
- `raiden-shogun` - Raiden from Genshin Impact
- `oppai` - Large-breasted characters
- `selfies` - Selfie-style images
- `uniform` - Uniform outfits
- `mori-calliope` - Calliope from Hololive

See all available tags: `curl https://api.waifu.im/tags`

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
│       ├── scheduled-post.yml
│       └── manual-dispatch.yml
├── src/
│   ├── clients/
│   │   ├── waifu-client.ts      # waifu.im API integration
│   │   └── discord-webhook.ts   # Discord webhook sender
│   ├── types/
│   │   └── waifu.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── config.ts            # Environment config
│   ├── main.ts                  # CLI entry point
│   └── scheduler.ts             # Cron scheduler
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

## 🙏 Credits

- [waifu.im](https://waifu.im) - API for anime images
- [Discord](https://discord.com) - For webhook integration

---

Made with 💖 and anime
