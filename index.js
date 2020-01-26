const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const fs = require('fs');
const mysql = require('mysql');

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

var dbExists = "1";

client.once('ready', () => {
	var con = mysql.createConnection({
  		host: "localhost",
  		user: "joseph",
  		password: "admin"
	});

	dbExists = "1";
	con.connect(function(err) {
  		if (err) throw err;
		  
		console.log("Connected!");

		var sql = "SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = 'yumabot'";
		con.query(sql, function (err, result, fields){
			if(result[0] != null){
				var {SCHEMA_NAME} = result[0];
				setDbExists(SCHEMA_NAME);
			}
		});
		
		console.log("brug" + " " + getDbExists())
		if(getDbExists() === null || getDbExists() === undefined){
  			con.query("CREATE DATABASE yumabot", function (err, result) {
				if (err) throw err;
			
				console.log("Database created");
			  });
		}
	});
	console.log('Ready!');
});


// Set and get
function setDbExists(value){
	dbExists = value;
}

function getDbExists(){
	console.log('getters '+dbExists);
	return dbExists;
}

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

client.login(token);
