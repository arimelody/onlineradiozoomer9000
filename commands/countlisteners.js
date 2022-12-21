const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { source } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listeners')
        .setDescription(`Check the amount of people currently listening to ${source.name}`),
    async execute(interaction) {
        // Fetch the number of listeners from the azuracast nowplaying API
        fetch(source.api)
            .then(async response => await response.json())
            .then(async data => {
                // Get the number of listeners from the API response - the bots own clients
                const listeners = data[0].listeners.total - 2;

                // Get the voice channels that the bot is in (if less than 1 listener dont show :D)
                const connected_channels = await Promise.all(interaction.client.guilds.cache.map(
                    async guild => {
                        const channel = await guild.channels.fetch(getVoiceConnection(guild.id).joinConfig.channelId)
                        if (channel.members.size > 1) return channel;
                    }
                ));

                // Create a new embed
                const embed = new EmbedBuilder()
                    .setTitle('listener count test')
                    .setDescription(`There are currently ${listeners} listeners listening to ${source.name}.`)
                    .addFields(connected_channels.map( channel => {
                        return {
                            name: `${channel.guild.name}`,
                            value: `${channel.members.size - 1}`
                        }
                    }));

                // Send the embed
                await interaction.reply({ embeds: [embed] });
            });
    }
};