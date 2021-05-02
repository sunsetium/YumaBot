const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('ff');

const addReactions = (message, reactions) => {
    message.react(reactions[0])
    reactions.shift()
    if (reactions.length > 0){
        setTimeout(() => addReactions(message, reactions), 750)
    }

}

module.exports = async (bot, msg, args, reactions = []) => {
    const channel = await client.channels.fetch(msg.channel)

    channel.messages.fetch().then((messages) => {
        if(messages.size === 0){
            //send a new message
            channel.send(text).then((message) => {
                addReactions(message,reactions)
            })
        } else{
            //edit the existing message
        }

    })
}

module.exports.help = {
    name: "react"
}

//Working example 3
/*
module.exports.run = async (bot, msg, args) => {
    msg.channel.send("gay bowser");
}
*/


//Working example
/*
module.exports.run = async (bot, msg, args) => {
    msg.react('😄');

}
*/


//Working example 2
/* 
module.exports.run = async (bot, msg, args) => {
    msg.react('👍').then(() => msg.react('👎'));
    const filter = (reaction, user) => {
        return ['👍', '👎'].includes(reaction.emoji.name) && user.id === msg.author.id;
    };
    
    msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        .then(collected => {
            const reaction = collected.first();

            if (reaction.emoji.name === '👍') {
                msg.reply('you reacted with a thumbs up.');
            } else {
                msg.reply('you reacted with a thumbs down.');
            }
        })
        .catch(collected => {
            msg.reply('you reacted with neither a thumbs up, nor a thumbs down.');
        });
}
*/

