const Discord = require("discord.js");
const config = require("./config.json");
const fs = require("fs");
const bot = new Discord.Client();
bot.commands = new Discord.Collection();

// Loads all commands
fs.readdir("./commands/", (err, files) => {
    if(err) console.log(err);

    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if(jsfile.length <= 0){
        console.log("Couldn't find commands");
        return;
    }

    jsfile.forEach((f, i) => {
        let props = require(`./commands/${f}`);
        console.log(`${f} loaded!`);
        bot.commands.set(props.help.name, props);
    });
});

// Bot is ready
bot.on('ready', () => {
  console.log(`Bot has started, with ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guilds.`); 

  bot.user.setActivity("Being a bot lol");
});

// On message event
bot.on('message', async msg => {

    // If a bot ignore the message.
    if(msg.author.bot) return;

    // Gets prefixes
    let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));

    // If no prefixes found set to the default
    if(!prefixes[msg.guild.id]){
        prefixes[msg.guild.id] = {
            prefixes: config.prefix
        };
    }

    let prefix = prefixes[msg.guild.id].prefixes;

    // Ignore messages that do not start with our prefix (default: !).
    if(msg.content.indexOf(prefix) !== 0) return;

    // Seperating the command name and its arguments into an array.
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    // Gets the command and args
    let commandFile = bot.commands.get(cmd);
    if(commandFile) commandFile.run(bot, msg, args);

});

bot.login(config.token);