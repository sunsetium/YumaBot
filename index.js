const Discord = require("discord.js");
const config = require("./config.json");
const fs = require("fs");
var jsonManip = require('./tools/json_manipulation.js');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();


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
            serverID: guild.id,
            ffMsgID: null,
            ffChannelID: null,
            ffRoleID: null,
            isUsingFF: false
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
    findFFOnReboot();
});

async function findFFOnReboot(){
    const guilds = bot.guilds.cache.map(guild => guild.id);
    // todo next step would be to make a new channel where the bot could start its processes.
    for(let i = 0; i < guilds.length; i++){
        let ffChannel = JSON.parse(fs.readFileSync(`./servers/${guilds[i]}/server_config.json`, "utf8"));
        if(ffChannel.ffChannelID != null){
            const channel = await bot.guilds.cache.get(guilds[i]).channels.cache.get(ffChannel.ffChannelID);
            channel.messages.fetch(ffChannel.ffMsgID).then(async (msg) =>{
                let commandFile = await bot.commands.get("friendfinder");
                if (commandFile) commandFile.run(bot, msg, ["setup"]);  
            })
        }
    }
}



// On message event
bot.on('message', async msg => {

    // If a bot ignore the message.
    if (msg.author.bot) return;

    // Gets prefixes
    let prefixes = jsonManip.jsonFileReader(`./servers/${msg.guild.id}/server_config.json`);

    let prefix = prefixes['prefix'];

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