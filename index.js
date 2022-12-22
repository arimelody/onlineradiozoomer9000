/**
 * ### MELLO ONLINE RADIO ZOOMER 9000 ###
 * 
 * original code written by zaire
 * good code rewritten by mellodoot
 */

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType, } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const client = new Client({ autoreconnect: true, intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const icy = require('icy');

const { bot_token, source, voice_channels } = require('./config.json');
/**
 * {
 * 		bot_token: [BOT TOKEN],
 * 		source: {
 * 			name: { String }
 * 			url: { String }
 * 		},
 * 		voice_channels: [
 * 			[VOICE CHANNEL ID],
 * 			...	
 * 		]
 * }
 */

const commands = [];
client.commands = new Collection();
const commands_path = path.join(__dirname, 'commands');
const command_files = fs.readdirSync(commands_path).filter(file => file.endsWith('.js'));

for (const file of command_files) {
    const file_path = path.join(commands_path, file);
    const command = require(file_path);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        logger.warn(`the command at ${file_path} is missing a required "data" or "execute" property!`);
    }
}

const player = createAudioPlayer();
const stream = createAudioResource(source.url);

client.on('ready', async () => {
	voice_channels.forEach(async voice_channel => {
		let connection = await connect_voice(voice_channel);
		play_stream(connection);
	});
	init_metadata_reader(source.url);

	client.guilds.fetch("736779848298660000").then(guild => {
        guild.commands.set(commands);
    });
});

/**
 * @param { String } voice_channel_id ID of the desired voice channel.
 * @returns { VoiceConnection } The resulting Discord voice channel upon connection.
 */
const connect_voice = (voice_channel_id) => new Promise(async (resolve) => {
	const voice_channel = await client.channels.fetch(voice_channel_id);

	const connection = joinVoiceChannel({
		channelId: voice_channel.id,
		guildId: voice_channel.guild.id,
		adapterCreator: voice_channel.guild.voiceAdapterCreator
	});

	resolve(connection);
});

/**
 * Subscribes the voice channel connection to the player feed, broadcasting audio from the source.
 * @param { VoiceConnection } connection 
 */
function play_stream(connection) {
	connection.subscribe(player);
	player.play(stream);
}

/**
 * Initialises the radio metadata tracking service, which updates the bot status accordingly.
 * @param {string} url A link to the radio source.
 */
function init_metadata_reader(url) {
	icy.get(url, function (i) {
		i.on('metadata', function (metadata) {
			let icyData = icy.parse(metadata);
			if (icyData.StreamTitle) set_activity(icyData.StreamTitle);
		});
		i.resume();
	});
}

/**
 * Sets the bot's current activity using the currently playing song name.
 * @param { String } song_name Expecting "Artist - Title" format
 */
function set_activity(song_name) {
	client.user.setPresence(
		{
			activities: [
				{
					name: `${song_name} on ${source.name} 📻`,
					type: ActivityType.Listening
				}
			],
			status: 'online'
		}
	);
}

//in file command handling as seen on discord.js/guide
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
	console.log('Ready!');
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(bot_token);
