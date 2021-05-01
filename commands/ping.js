const Discord = require("discord.js");
const fs = require("fs");

module.exports.run = async (bot, msg, args) => {
    if(!msg.member.hasPermission("MANAGE_SERVER")) return msg.reply("No no no");
    if(!args[0] || args[0] === "help") return msg.reply("Usage: !prefix <prefix>");

    let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
    prefixes[msg.guild.id] = {
        prefixes: args[0]
    }
    fs.writeFile("./prefixes.json", JSON.stringify(prefixes), (err) => {
        if(err) console.log(err);
    });

    let sEmbeb = new Discord.RichEmbed()
    .setColor("#FF9900")
    .setTitle("Prefix Set!")
    .setDescription(`Set to ${args[0]}`);

    msg.channel.send(sEmbeb);
}

module.exports.help = {
    name: "prefix"
}