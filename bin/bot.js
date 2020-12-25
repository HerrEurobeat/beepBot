﻿//This file controls one shard
const bootstart = new Date()
const shardArgs = process.argv //ignore index 0 and 1

const Discord  = require("discord.js")
const readline = require("readline")
const path     = require("path")
const nedb     = require("nedb")
const fs       = require("fs")

const configpath = "./config.json"
const config     = require(configpath)
const constants  = require("./constants.json")

const bot = new Discord.Client()
var   fn  = {} //object that will contain all functions to be accessible from commands

/* ------------ Functions for all shards: ------------ */
/**
 * Logs text to the terminal and appends it to the output.txt file.
 * @param {String} type info, warn or error
 * @param {String} origin Filename from where the text originates from
 * @param {String} str The text to log into the terminal
 * @param {Boolean} nodate Setting to true will hide date and time in the message
 * @param {Boolean} remove Setting to true will remove this message with the next one
 * @returns {String} The resulting String
 */
var logger = (type, origin, str, nodate, remove) => { //Custom logger
    var str = String(str)
    if (str.toLowerCase().includes("error")) { var str = `\x1b[31m${str}\x1b[0m` }

    //Define type
    if (type == 'info') {
        var typestr = `\x1b[34mINFO`
    } else if (type == 'warn') {
        var typestr = `\x1b[31mWARN`
    } else if (type == 'error') {
        var typestr = `\x1b[31m\x1b[7mERROR\x1b[0m\x1b[31m`
    } else {
        var typestr = '' }

    //Define origin
    if (origin != "") {
        if (typestr == "") var originstr = `\x1b[34m${origin}`
        else var originstr = `${origin}` 
    } else var originstr = ''

    //Add date or don't
    if (nodate) var date = '';
        else { //Only add date to message if it gets called at least 15 sec after bootup. This makes the startup cleaner.
        if (new Date() - bootstart > 15000) var date = `\x1b[34m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m `
            else var date = '' }

    //Add filers
    if (typestr != "" || originstr != "") { 
        filler1 = "["
        filler3 = "\x1b[0m] "
    } else {
        filler1 = ""
        filler3 = "" }

    if (typestr != "" && originstr != "") {
        filler2 = " | "
    } else {
        filler2 = ""
    }

    //Put it together
    var string = `${filler1}${typestr}${filler2}${originstr}${filler3}${date}${str}`

    //Print message with remove or without
    if (remove) {
        readline.clearLine(process.stdout, 0) //0 clears entire line
        process.stdout.write(`${string}\r`)
    } else {
        readline.clearLine(process.stdout, 0)
        console.log(`${string}`) }

    fs.appendFileSync('./bin/output.txt', string.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '') + '\n', err => { //Regex Credit: https://github.com/Filirom1/stripcolorcodes
        if(err) console.log('logger function appendFileSync error: ' + err) }) 

    return string; } //Return String, maybe it is useful for the calling file

/**
* Returns the language obj the specified server has set
* @param {Number} guildid The id of the guild
* @returns {Object} lang object callback
*/
var lang = (guildid, callback) => {
    if (!guildid) { logger('error', 'bot.js', "function lang: guildid not specified!"); return; }

    settings.findOne({ guildid: guildid }, (err, data) => {
        if (!data) var serverlang = constants.defaultguildsettings.lang
            else var serverlang = data.lang
        
        if (!Object.keys(bot.langObj).includes(serverlang)) {
            logger("warn", "bot.js", `Guild ${guildid} has an invalid language! Returning english language...`)
            callback(bot.langObj["english"]) }
        
        callback(bot.langObj[serverlang])
    }) }

/**
 * Adds the specified guild to the settings database with default values
 * @param {Object} guild The message.guild object
 * @param {Boolean} removeentry Removes the guild from the database
 */
var servertosettings = (guild, removeentry) => {
    if (!guild.id) return logger("error", "bot.js", "Can't write guild to settings because guild id undefined!"); //missing guildid will make entry unuseable

    //if removeentry is true just remove entry and stop further execution
    if (removeentry) {
        logger("info", "bot.js", `Removing ${guild.id} from settings database...`, false, true)
        settings.remove({ guildid: guild.id }, (err) => { if (err) logger("error", "bot.js", `servertosettings error removing guild ${guild.id}: ${err}`)
        return; }) }

    settings.findOne({ guildid: guild.id }, (err, data) => {
        //adding prefix to server nickname
        if (guild.members.cache.get(bot.user.id).nickname === null) { //bot has no nickname, start nickname with username
            var nickname = bot.user.username
        } else {
            if (!data || !data.prefix) var nickname = guild.members.cache.get(String(bot.user.id).nickname) //get nickname without trying to replace old prefix if server has no entry in settings.json yet
                else var nickname = guild.members.cache.get(String(bot.user.id)).nickname.replace(` [${data.prefix}]`, "") }

        if (config.loginmode == "normal") var prefix = constants.DEFAULTPREFIX
            else var prefix = constants.DEFAULTTESTPREFIX
        
        if (nickname == undefined) var nickname = bot.user.username //since nickname can still somehow be undefined check one last time
        guild.members.cache.get(String(bot.user.id)).setNickname(`${nickname} [${prefix}]`).catch(err => {}) //catch error but ignore it

        let defaultguildsettings = constants.defaultguildsettings
        defaultguildsettings["guildid"] = guild.id
        defaultguildsettings["prefix"] = prefix

        logger("info", "bot.js", `Adding ${guild.id} to settings database with default settings...`, false, true)
        if (data) settings.remove({ guildid: guild.id }, (err) => { if (err) logger("error", "bot.js", `servertosettings error removing guild ${guild.id}: ${err}` + err) })
        settings.insert(defaultguildsettings, (err) => { if (err) logger("error", "bot.js", "servertosettings error inserting guild: " + err) })
    })
}

/**
 * Attempts to get a user object from a message
 * @param {Object} message The message object
 * @param {Array} args The args array
 * @param {Boolean} allowauthorreturn Specifies if the function should return the author if no args is given
 * @returns {Object} The retrieved user object
 */
var getuserfrommsg = (message, args, allowauthorreturn) => {
    if (!args[0] && allowauthorreturn) return message.author
    else if (message.guild.members.cache.find(member => member.user.username == args[0])) return message.guild.members.cache.find(member => member.user.username == args[0]).user
    else if (message.guild.members.cache.find(member => member.nickname == args[0])) return message.guild.members.cache.find(member => member.nickname == args[0]).user
    else if (message.guild.members.cache.get(args[0])) return message.guild.members.cache.get(args[0]).user
    else if (message.mentions.users.first()) return message.mentions.users.first()
    else return {} }

/**
 * Rounds a number with x decimals
 * @param {Number} value Number to round 
 * @param {Number} decimals Amount of decimals
 * @returns {Number} Rounded number
 */
var round = (value, decimals) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals) }

/**
 * Returns random hex value
 * @returns {Number} Hex value
 */
var randomhex = () => {
    return Math.floor(Math.random() * 16777214) + 1 }

/**
 * Returns a random String from an array
 * @param {Array<String>} arr An Array with Strings to choose from
 * @returns {String} A random String from the provided array
 */
var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]

var owneronlyerror = (guildid) => { return randomstring(lang(guildid).general.owneronlyerror) + " (Bot Owner only-Error)" }
var usermissperm   = (guildid) => { return randomstring(lang(guildid).general.usermissperm) + " (Role permission-Error)" }


/* -------------- Command reader -------------- */
bot.commands = new Discord.Collection()

let commandcount = 0;
const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory())

dirs('./bin/commands').forEach((k, i) => {
    fs.readdir(`./bin/commands/${k}`, (err, files) => {
        if (err) logger('error', 'bot.js', err);
        var jsfiles = files.filter(p => p.split('.').pop() === 'js');
        
        jsfiles.forEach((f) => {
            var cmd = require(`./commands/${k}/${f}`);

            for(j = 0; j < cmd.info.names.length; j++) { //get all aliases of each command
                var tempcmd = JSON.parse(JSON.stringify(cmd)) //Yes, this practice of a deep copy is probably bad but everything else also modified other Collection entries and I sat at this problem for 3 fucking hours now
                tempcmd["run"] = cmd.run //Add command code to new deep copy because that got lost somehow
                tempcmd.info.category = k

                if (bot.commands.get(tempcmd.info.names[j])) return logger("warn", "bot.js", `Duplicate command name found! Command: ${tempcmd.info.names[j]}`, true)

                if (j != 0) tempcmd.info.thisisanalias = true //seems like this is an alias
                    else { 
                        commandcount++
                        tempcmd.info.thisisanalias = false }

                bot.commands.set(tempcmd.info.names[j], tempcmd) }
        })
    })
})


/* -------------- Create lang object -------------- */
/**
 * Function to construct the language object
 * @param {String} dir Language Folder Root Path
 */
function langFiles(dir) { //Idea from https://stackoverflow.com/a/63111390/12934162
    fs.readdirSync(dir).forEach(file => {
        const absolute = path.join(dir, file);
        if (fs.statSync(absolute).isDirectory()) return langFiles(absolute);
        else {
            if (!file.includes(".json")) return; //ignore all files that aren't .json
            let result = absolute.replace(".json", "").replace(/\\/g, '/').split("/") //remove file ending, convert windows \ to unix / and split path into array

            result.splice(0, 2); //remove "bin" and "lang"
            result.splice(2, 1); //remove category name

            if (!bot.langObj[result[0]]) bot.langObj[result[0]] = {} //create language key
            if (!bot.langObj[result[0]]["cmd"]) bot.langObj[result[0]]["cmd"] = {} //create cmd key

            try {
                if (result[1] == "commands") {
                    bot.langObj[result[0]]["cmd"][result[2]] = require(absolute.replace("bin", "."))
                } else {
                    bot.langObj[result[0]][result[1]] = require(absolute.replace("bin", ".")) }
            } catch(err) {
                if (err) logger("warn", "bot.js", `langFiles function: lang ${result[0]} has an invalid file: ${err}`) }
            
            return; }
    }) }

bot.langObj = {}
langFiles("./bin/lang/"); //RECURSION TIME!


//Add functions top fn object
fn = { logger, lang, servertosettings, getuserfrommsg, round, randomhex, randomstring, owneronlyerror, usermissperm }

process.on('unhandledRejection', (reason, p) => {
    logger('error', 'bot.js', `Unhandled Rejection! Reason: ${reason.stack}`) });

process.on('uncaughtException', (reason, p) => {
    logger('error', 'bot.js', `Uncaught Exception! Reason: ${reason.stack}`) });


/* -------------- Load databases -------------- */
const settings = new nedb('./bin/data/settings.db') //initialise database
settings.loadDatabase((err) => {
    if (err) return logger("error", "bot.js", "Error loading settings database. Error: " + err)
    logger("info", "bot.js", "Successfully loaded settings database.", false, true)}); //load db content into memory
bot.settings = settings; //add reference to bot obj

/* ------------ Startup: ------------ */
bot.on("ready", async function() {
    if (bot.guilds.cache.array()[0] == undefined) return logger("warn", "bot.js", "This shard has no guilds and is therefore unused!");
    var thisshard = bot.guilds.cache.array()[0].shard //Get shard instance of this shard with this "workaround" because it isn't directly accessable

    //Set activity
    bot.user.setPresence({activity: { name: config.gamerotation[0] }, status: config.status }).catch(err => { return logger("", "", "Woops! Couldn't set presence: " + err); })  

    if (thisshard.id == 0) {
        //Finish startup messages from controller.js
        logger("", "", `> ${commandcount} commands & ${Object.keys(bot.langObj).length} languages found!`)
        logger("", "", "> Successfully logged in shard0!")
        logger("", "", "*--------------------------------------------------------------*\n ", true) }

    setTimeout(() => {
        logger("", "", "", true, true) //Print empty line to clear other stuff
    }, 2500);
});

/* ------------ Event Handlers: ------------ */
bot.on("guildCreate", guild => {
    servertosettings(bot, guild)
    logger('info', 'bot.js', `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount-1} other members!`)
    
    //welcome message mit help link und settings setup aufforderung
})

bot.on("guildDelete", async guild => {
    bot.shard.fetchClientValues("guilds.cache.size").then(res => { //wait for promise
        logger('info', 'bot.js', `I have been removed from: ${guild.name} (${guild.id}). I'm now in ${res} servers.`) })

    servertosettings(guild.id, true) }); //true argument will remove function from db

bot.on("guildMemberAdd", member => {
    if (config.loginmode == "test") return;

    //take care of greetmsg
    if (bot.settings[member.guild.id].systemchannel != null && bot.settings[member.guild.id].greetmsg != null) {
        //check settings.json for greetmsg, replace username and servername and send it into setting's systemchannel
        let msgtosend = String(bot.settings[member.guild.id].greetmsg)

        if (msgtosend.includes("@username")) msgtosend = msgtosend.replace("@username", `<@${member.user.id}>`)
            else msgtosend = msgtosend.replace("username", member.user.username)
        msgtosend = msgtosend.replace("servername", member.guild.name)

        member.guild.channels.cache.get(String(bot.settings[member.guild.id].systemchannel)).send(msgtosend) }

    //take care of memberaddrole
    if (bot.settings[member.guild.id].memberaddroles.length > 0) {
        member.roles.add(bot.settings[member.guild.id].memberaddroles) } //add all roles at once (memberaddroles is an array)
});

bot.on("guildMemberRemove", member => {
    if (config.loginmode == "test") return;
    if (bot.settings[member.guild.id].systemchannel == null) return;
    if (bot.settings[member.guild.id].byemsg == null) return;

    let msgtosend = String(bot.settings[member.guild.id].byemsg)
    msgtosend = msgtosend.replace("username", member.user.username)
    msgtosend = msgtosend.replace("servername", member.guild.name)

    member.guild.channels.cache.get(String(bot.settings[member.guild.id].systemchannel)).send(msgtosend)
})

/* ------------ Message Handler: ------------ */
bot.on('message', (message) => {
    if (message.author.bot) return;
    var thisshard = message.guild.shard //Get shard instance of this shard with this "workaround" because it isn't directly accessable

    //if (message.guild.id != "232550371191554051" && message.guild.id != "331822220051611648") return; //don't respond to other guilds when testing with normal loginmode
    if (message.channel.type == "text" && config.loginmode == "test") logger("info", "bot.js", `Shard ${thisshard.id}: ${message}`)

    if (message.channel.type !== "dm") {
        if (message.mentions.members.size > 0) {
            if (message.mentions.members.get(bot.user.id) != undefined) {
                message.react(bot.guilds.cache.get("232550371191554051").emojis.cache.find(emoji => emoji.name === "notification")).catch(err => {
                    logger('error', 'bot.js', "mention reaction Error: " + err) }) }}}

    settings.findOne({ guildid: message.guild.id }, (err, guildsettings) => { //fetch guild data once and pass it with run function
        if (err) {
            logger("error", "bot.js", "msg Event: Error fetching guild from database: " + err)
            message.channel.send("Something went wrong getting your guild's settings from the database. Please try again later.")
            return; }

        //Check if guild is in settings db and add it if it isn't
        if (message.channel.type !== "dm") {
            if (!guildsettings) { 
                servertosettings(message.guild)
        
                //quickly construct guildsettings object to be able to carry on
                if (config.loginmode == "normal") var prefix = constants.DEFAULTPREFIX
                    else var prefix = constants.DEFAULTTESTPREFIX

                guildsettings = constants.defaultguildsettings
                guildsettings["guildid"] = message.guild.id
                guildsettings["prefix"] = prefix
        }}

        if (message.channel.type !== "dm") { var PREFIX = guildsettings.prefix } else { var PREFIX = DEFAULTPREFIX } //get prefix for this guild or set default prefix if channel is dm

        if (message.content.startsWith(PREFIX)) { //check for normal prefix
            var cont = message.content.slice(PREFIX.length).split(" ");
        } else if (message.mentions.users.get(bot.user.id)) { //if no prefix given, check for mention
            var cont = message.content.slice(22).split(" "); //split off the mention <@id>

            if (cont[0] == "") { var cont = cont.slice(1) } //check for space between mention and command
            if (cont.toString().startsWith(PREFIX)) { var cont = cont.toString().slice(PREFIX.length).split(" "); } //the user even added a prefix between mention and cmd? get rid of it.
        } else { //normal message? stop.
            return; }

        if (!cont[0]) return; //message is empty after prefix I guess

        var args = cont.slice(1);
        var cmd  = bot.commands.get(cont[0].toLowerCase());

        if (message.channel.type === "dm") {
            if (cmd && cmd.info.allowedindm === false) return message.channel.send(randomstring(["That cannot work in a dm. :face_palm:","That won't work in a DM...","This command in a DM? No.","Sorry but no. Try it on a server.","You need to be on a server!"]) + " (DM-Error)") }

        if (cmd) { //check if command is existing and run it
            if (cmd.info.nsfwonly == true && !message.channel.nsfw) return message.channel.send(lang(message.guild.id).nsfwonlyerror)
            
            var ab = cmd.info.accessableby

            if (!ab.includes("all")) { //check if user is allowed to use this command
                if (ab.includes("botowner")) {
                    if (message.author.id !== '231827708198256642') return message.channel.send(owneronlyerror(message.guild.id))
                } else if (message.guild.owner && message.author.id == message.guild.owner.id) { //check if owner property is accessible otherwise skip this step. This can be null because of Discord's privacy perms but will definitely be not null should the guild owner be the msg author and only then this step is even of use
                    //nothing to do here, just not returning an error message and let the server owner do what he wants
                } else if (ab.includes("admins")) {
                    if(!guildsettings.adminroles.filter(element => message.member.roles.cache.has(element)).length > 0) return message.channel.send(usermissperm(message.guild.id))
                } else if (ab.includes("moderators")) {
                    if(!guildsettings.moderatorroles.filter(element => message.member.roles.cache.has(element)).length > 0) return message.channel.send(usermissperm(message.guild.id))
                } else {
                    message.channel.send(`This command seems to have an invalid restriction setting. I'll have to stop the execution of this command to prevent safety issues.\n${BOTOWNER} will probably see this error and fix it.`)
                    logger('warn', 'bot.js', `The command restriction \x1b[31m'${ab}'\x1b[0m is invalid. Stopping the execution of the command \x1b[31m'${cont[0]}'\x1b[0m to prevent safety issues.`)
                    return;
                }}

            if (message.channel.type === "dm") cmd.run(bot, message, args, englishlang, logger, guildsettings, fn)
                else {
                    lang(message.guild.id, lang => {
                        cmd.run(bot, message, args, lang, logger, guildsettings, fn) }) } //run the command after lang function callback
            
            return;
        } else { //cmd not recognized? check if channel is dm and send error message
            if (message.channel.type === "dm") {
                message.channel.send(randomstring(["Invalid command! :neutral_face:","You got something wrong there!","Something is wrong... :thinking:","Whoops - it seems like this command doesn't exists.","Trust me. Something is wrong with your command.","That is not right."]) + " (Wrong command-Error)") }
            return; }
    })
});

setTimeout(() => {
    logger("info", "bot.js", "Logging in...", false, true)
}, 550); //Needs to be slightly longer than controller.js shardCreate timeout
bot.login() //Token is provided by the shard manager