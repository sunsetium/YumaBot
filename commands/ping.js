const Discord = require("discord.js");


module.exports.run = async (bot, msg, args) => {
    msg.reply("PONG");
}

module.exports.help = {
    name: "ping"
}