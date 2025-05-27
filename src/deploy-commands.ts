import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

type DeployCommandsProps = {
  guildId?: string; // Ahora es opcional
};

export async function deployCommands({ guildId }: DeployCommandsProps = {}) {
  try {
    console.log("Started refreshing application (/) commands.");

    if (guildId) {
      // Deploy commands to a specific guild (instant update)
      await rest.put(
        Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
        { body: commandsData }
      );
      console.log(
        `Successfully reloaded guild (/) commands for guild ${guildId}.`
      );
    } else {
      // Deploy commands globally (may take up to 1 hour to update)
      await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), {
        body: commandsData,
      });
      console.log("Successfully reloaded global application (/) commands.");
    }
  } catch (error) {
    console.error(error);
  }
}
