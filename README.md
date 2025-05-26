# MAGA-BOT

A Discord bot to help manage your server.

## Requirements

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Discord Bot Token](https://discord.com/developers/applications)
- `.env` file with your bot token

## Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/MAGA-BOT.git
   cd MAGA-BOT
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Create a `.env` file:**
   ```
   DISCORD_TOKEN=your-bot-token-here
   ```

4. **Build the project:**
   ```sh
   npm run build
   ```

5. **Start the bot:**
   ```sh
   npm start
   ```

6. **For development (hot reload):**
   ```sh
   npm run dev
   ```

## Scripts

- `npm run dev` — Start the bot in development mode with hot reload.
- `npm run build` — Build the TypeScript source code.
- `npm start` — Run the compiled bot.

## Notes

- Do **not** commit your `.env` file or `node_modules` folder.
- Make sure your bot has the necessary permissions in your Discord server.

## License

MIT