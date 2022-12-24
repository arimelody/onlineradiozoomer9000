const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { source, voice_channels } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listeners')
        .setDescription(`Check the amount of people currently listening to ${source.name}`),
    async execute(interaction) {
        // Fetch the number of listeners from the azuracast nowplaying API
        fetch(source.api)
            .then(async response => await response.json())
            .then(async data => {
                // get the number of listeners from the API response, minus the bot
                const listeners = data[0].listeners.total - 1;
                const one = listeners == 1;

                // get the voice channels that the bot is in
                // (if there's only 1 listener in the channel, it's probably the bot. that doesn't count!)
                const connected_channels = await Object.keys(voice_channels).reduce(
                    async (channels, guild_id) => {
                        const guild = await interaction.client.guilds.fetch(guild_id);
                        const channel = await guild.channels.fetch(voice_channels[guild_id]);
                        if (channel.members.size > 1) channels.push(channel);
                        return channels;
                    }, []);

                // create our embed
                const embed = new EmbedBuilder()
                    .setTitle(`Current listeners on ${source.name}:`)
                    .setThumbnail(data[0].now_playing.song.art)
                    .setDescription(`There ${one ? "is" : "are"} currently ${listeners} listener${one ? "" : "s"} listening to ${source.name}.`)
                    .addFields(connected_channels.map( channel => {
                        return {
                            name: `${channel.guild.name}`,
                            value: `${channel.members.size - 1}`
                        }
                    }))
                    .setFooter({text: `💿 Now Playing: "${data[0].now_playing.song.text}" (${data[0].now_playing.playlist})`});

                // send the embed!
                await interaction.reply({ embeds: [embed] });
            });
    }
};