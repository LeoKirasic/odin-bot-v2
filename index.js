const { Client, GatewayIntentBits, Partials } = require('discord.js');

const { globSync } = require('glob');
const path = require('path');
const {
  listenToMessages, listenToReactions, listenToInteractions, listenToModalSubmits,
} = require('./botEngine');
const { guildId, token } = require('./config');
require('./bin/deploy-commands');

globSync('./botCommands/**/*.js', { ignore: 'botCommands/**/*.test.js' }).forEach((file) => {
  require(`${path.resolve(file)}`); // eslint-disable-line global-require, import/no-dynamic-require
});

const client = new Client({
  intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessageReactions], // eslint-disable-line max-len
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once('ready', async () => {
  console.log('Bot session started:', new Date());

  // Fetch Guild members on startup to ensure the integrity of the cache
  const guild = await client.guilds.fetch(guildId);
  await guild.members.fetch();
});

listenToMessages(client);
listenToReactions(client);
listenToInteractions(client);
listenToModalSubmits(client);

client.login(token);
