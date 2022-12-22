const { SlashCommandBuilder } = require('discord.js');
const { source } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('songhistory')
        .setDescription(`Shows you the last 5 songs that played from ${source.name}!`),
    async execute(interaction) {

        const response = await fetch(source.api);
        const data = await response.json();
        const songs = [];
        data[0].song_history.forEach(element => {
            songs.push(element.song)
        });

    const songList = songs.map(song => `- ${song.text}`).join('\n');

        const embed = {
            color: 0x000000,
            title: `currently playing: ${data[0].now_playing.song.text}!`,
            description: songList
        }
        await interaction.reply({ embeds: [embed] })
    },
};


