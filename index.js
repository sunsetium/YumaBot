const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const fs = require('fs');
const mysql = require('mysql');

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

var dbExists = undefined;
var userReactList = [];

client.once('ready', () => {
	var con = mysql.createConnection({
  		host: "localhost",
  		user: "sunny",
  		password: "admin"
	});

	con.connect(function(err) {
  		if (err) throw err;
		  
		console.log("Connected to DB!");

		var sql = "SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = 'yumabot'";
		con.query(sql, function (err, result, fields){
			if(result[0] !== undefined){
				var {SCHEMA_NAME} = result[0];
				setDbExists(SCHEMA_NAME);
			}
			else
			{
				if(getDbExists() === null || getDbExists() === undefined){
					con.query("CREATE DATABASE yumabot", function (err, result) {
					  if (err) throw err;
				  
					  console.log("Database created");
					});

					var insert = "CREATE TABLE yumabot.friends (serverid varchar(255)," +
														"userid varchar(255)," +
														"status varchar(1))"
					con.query(insert, function(err, result){
						if(err) throw err
						console.log("Table Created");
					});
			  }
			}
		});
	});

	console.log('Ready!');
});


client.on('messageReactionAdd', async (reaction, user) => {
	// When we receive a reaction we check if the message is partial or not
	if (reaction.message.partial) {
		// If the message was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.message.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
		}
	}
	// Now the message has been cached and is fully available
	console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
	console.log(`${reaction.users.array()}`)
	
	var con = mysql.createConnection({
		host: "localhost",
		user: "sunny",
		password: "admin"
  });

  con.connect(function(err) {
	var userIDArray = reaction.users.array();
	for(var i=0; i < userIDArray.length; i++)
	{
		//getting user id stripped of the punctuation
		var userID = userIDArray[i].toString().replace(/\D/g,' ').trim();
		userReactList[i] = userID;


		var check = `SELECT userid, status FROM yumabot.friends WHERE userid = ${userID}`;
		con.query(check, function(err, result){
			if(result[0] === undefined){
				var sqlInsert = `INSERT INTO yumabot.friends (serverid, userid, status) VALUES (${reaction.message.guild.id}, ${userID}, 'A')`; // A stands for Available
				con.query(sqlInsert, function(err, result){
					if(err) throw err;
					console.log("1 record inserted");
				});
			}else{
				var {status} = result[0]
				if(status == "U"){
					var checkDb = `UPDATE yumabot.friends SET status = 'A' WHERE userid = ${userID}`;
					con.query(checkDb, function(err, result){
						if(err) throw err
						console.log("1 Row was updated!");
					});
				}
			}
		});
	}
  });

	// We can also check if the reaction is partial or not
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the reaction: ', error);
		}
	}
	// Now the reaction is fully available and the properties will be reflected accurately:
	console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
});

client.on('messageReactionRemove', (reaction, user) => {
	var userIDRemover = user.toString().replace(/\D/g,' ').trim();

	var con = mysql.createConnection({
		host: "localhost",
		user: "sunny",
		password: "admin"
	  });
	  
	  var check = `UPDATE yumabot.friends SET status = 'U' WHERE userid = ${userIDRemover}`;
		con.query(check, function(err, result){
			if(err) throw err
			console.log("1 Row was updated!");
		});
	

});

client.on('raw', packet => {
    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    // Grab the channel to check the message from
    const channel = client.channels.get(packet.d.channel_id);
    // There's no need to emit if the message is cached, because the event will fire anyway for that
    if (channel.messages.has(packet.d.message_id)) return;
    // Since we have confirmed the message is not cached, let's fetch it
    channel.fetchMessage(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.get(emoji);
        // Adds the currently reacting user to the reaction's users collection.
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
        }
    });
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();
	
	if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

function setDbExists(value){
	dbExists = value;
}

function getDbExists(){
	return dbExists;
}

client.login(token);
