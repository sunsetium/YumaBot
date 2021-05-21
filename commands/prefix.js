const Discord = require("discord.js");
var jsonManip = require('../tools/json_manipulation.js');
const fs = require("fs");

module.exports.run = async (bot, msg, args) => {
    if(!msg.member.hasPermission("MANAGE_SERVER")) return;
    if(!args[0] || args[0] === "help") return msg.reply("Usage: !prefix <prefix>");

    jsonManip.jsonFileUpdate(`./servers/${msg.guild.id}/server_config.json`, 'prefix', args[0])

    msg.channel.send(
`>>> Prefix set to ${args[0]}`);
}

module.exports.help = {
    name: "prefix"
}