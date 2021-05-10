const Discord = require("discord.js");
const config = require("./config.json");
const fs = require("fs");
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('ff.db');


// Loads all commands
fs.readdir("./commands/", (err, files) => {
    if (err) console.log(err);

    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if (jsfile.length <= 0) {
        console.log("Couldn't find commands");
        return;
    }

    jsfile.forEach((f, i) => {
        let props = require(`./commands/${f}`);
        console.log(`${f} loaded!`);
        bot.commands.set(props.help.name, props);
    });
});

// When bot joined guild
bot.on('guildCreate', async guild => {
    console.log("The bot has now joined guild: " + guild.id + ": " + guild.name);
    var dirName = `./servers/${guild.id}`;
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
        let configJson = {
            prefix: '!',
            ffMsgID: null,
            ffChannelID: null,
            ffRoleID: null
        };
        let data = JSON.stringify(configJson);
        fs.writeFileSync(`./servers/${guild.id}/server_config.json`, data);
    }
});

//When bot leaves guild.
bot.on('guildDelete', async guild => {
    console.log("The bot has now left guild: " + guild.id + ": " + guild.name);
    fs.rmSync(`./servers/${guild.id}`, { recursive: true });
    console.log('deleted corresponding directory');
});


// Bot is ready
bot.on('ready', () => {
    bot.user.setActivity("pog-gress");
    //prints all the guilds that the bot is in.
    const guilds = bot.guilds.cache.map(guild => guild.id);
    // todo next step would be to make a new channel where the bot could start its processes.
    for(let i = 0; i < guilds.length; i++){
        let ffChannel = JSON.parse(fs.readFileSync(`./servers/${guilds[i]}/server_config.json`, "utf8"));
        if(ffChannel.ffChannelID != null){
            const channel = bot.guilds.cache.get(guilds[i]).channels.cache.get(ffChannel.ffChannelID);
            return channel.messages.fetch(ffChannel.ffMsgID).then((msg) =>{
                let commandFile = bot.commands.get("setup");
                if (commandFile) commandFile.run(bot, msg, []);  
            })
        }
    }
});



// On message event
bot.on('message', async msg => {

    // If a bot ignore the message.
    if (msg.author.bot) return;

    // Gets prefixes
    let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));

    // If no prefixes found set to the default
    if (!prefixes[msg.guild.id]) {
        prefixes[msg.guild.id] = {
            prefixes: config.prefix
        };
    }

    let prefix = prefixes[msg.guild.id].prefixes;

    // Ignore messages that do not start with our prefix (default: !).
    if (msg.content.indexOf(prefix) !== 0) return;

    // Seperating the command name and its arguments into an array.
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    // Gets the command and args
    let commandFile = bot.commands.get(cmd);
    if (commandFile) commandFile.run(bot, msg, args);

});


bot.login(config.token);