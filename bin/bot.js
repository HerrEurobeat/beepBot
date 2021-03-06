﻿//This file controls one shard
//Note: This file had like 720 lines so I moved some code into the 'events' & 'functions' folder

var bootstart   = 0;
var bootstart   = Date.now()
const shardArgs = process.argv //eslint-disable-line no-unused-vars

const Discord  = require("discord.js")
const path     = require("path")
const nedb     = require("nedb")
const fs       = require("fs")

const configpath = "./config.json"
const config     = require(configpath)
const constants  = require("./constants.json")

const bot = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] }) //partials are messages that are not fully cached and have to be fetched manually
var   fn  = {} //object that will contain all functions to be accessible from commands

var loggedin      = false
var logafterlogin = []

bot.config    = config //I'm just gonna add it to the bot object as quite a few cmds will probably need the config later on
bot.constants = constants

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
    if (loggedin) logafterlogin = undefined
    return require("./functions/logger.js").run(bootstart, type, origin, str, nodate, remove, logafterlogin) } //call the run function of the file which contains the code of this function

/**
* Returns the language obj the specified server has set
* @param {Number} guildid The id of the guild
* @returns {Object} lang object callback
*/
var lang = (guildid, guildsettings) => {
    if (!guildid) { logger('error', 'bot.js', "function lang: guildid not specified!"); return; }

    if (!guildsettings) var serverlang = constants.defaultguildsettings.lang
        else var serverlang = guildsettings.lang
    
    if (!Object.keys(bot.langObj).includes(serverlang)) {
        logger("warn", "bot.js", `Guild ${guildid} has an invalid language! Returning english language...`)
        return bot.langObj["english"] }
    
    return bot.langObj[serverlang]
}

/**
 * Adds the specified guild to the settings database with default values
 * @param {Object} guild The message.guild object
 * @param {Boolean} removeentry Removes the guild from the database
 */
var servertosettings = (guild, removeentry) => {
    require("./functions/servertosettings.js").run(bot, logger, guild, removeentry) } //call the run function of the file which contains the code of this function

/**
 * Attempts to get a user object from a message
 * @param {Object} message The message object
 * @param {Array} args The args array
 * @param {Number} startindex The index of the args array to start searching from
 * @param {Number} endindex The index of the args array to stop searching (won't be included) (optional)
 * @param {Boolean} allowauthorreturn Specifies if the function should return the author if no args is given
 * @param {Array} stoparguments Arguments that will stop/limit the search (basically an automatic endindex)
 * @returns The retrieved user object, undefined if nothing was found or a number >1 if more than one user was found
 */
var getuserfrommsg = (message, args, startindex, endindex, allowauthorreturn, stoparguments) => {
    return require("./functions/getuserfrommsg.js").run(message, args, startindex, endindex, allowauthorreturn, stoparguments) }

/**
 * Attempts to get time from message and converts it into ms
 * @param {Array} args The args array
 * @returns {Number} time in ms
 * @returns {Number} index of time unit in lang.general.gettimefuncoptions
 * @returns {Array} Array containing amount and unit. Example: ["2", "minutes"]
 */
var gettimefrommsg = (args, callback) => {
    require("./functions/gettimefrommsg.js").run(args, (time, unitindex, arr) => { callback(time, unitindex, arr) }) } //callback the callback

/**
 * Attempts to get a reason from a message
 * @param {Array} args The args array
 * @param {Array} stoparguments Arguments that will stop/limit the search
 * @returns reason and reasontext (reason is for Audit Log, reasontext for message)
 */
var getreasonfrommsg = (args, stoparguments, callback) => {
    require("./functions/getreasonfrommsg.js").run(args, stoparguments, (reason, reasontext) => { callback(reason, reasontext) }) } //callback the callback

/**
 * Sends a message to the modlogchannel of that guild if it has one set
 * @param {Discord.Guild} guild The guild obj
 * @param {String} action Type of action
 * @param {Discord.User} author Initiator of the action
 * @param {Discord.User} reciever The affected user of the action 
 * @param {Array<String>} details Additional details
 */
var msgtomodlogchannel = (guild, action, author, reciever, details) => {
    require("./functions/msgtomodlogchannel.js").run(bot, logger, guild, action, author, reciever, details) } //call the run function of the file which contains the code of this function

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

var owneronlyerror = (lang) => { return randomstring(lang.general.owneronlyerror) + " (Bot Owner only-Error)" }
var usermissperm   = (lang) => { return randomstring(lang.general.usermissperm) + " (Role permission-Error)" }


/* -------------- Command reader -------------- */
bot.commands = new Discord.Collection()

var commandcount = 0;
const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory())

dirs('./bin/commands').forEach((k) => {
    fs.readdir(`./bin/commands/${k}`, (err, files) => {
        if (err) logger('error', 'bot.js', err);
        var jsfiles = files.filter(p => p.split('.').pop() === 'js');
        
        jsfiles.forEach((f) => {
            var cmd = require(`./commands/${k}/${f}`);

            for(let j = 0; j < cmd.info.names.length; j++) { //get all aliases of each command
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
    }) })

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


//Add functions to fn object
fn = { logger, lang, servertosettings, getuserfrommsg, gettimefrommsg, getreasonfrommsg, msgtomodlogchannel, round, randomhex, randomstring, owneronlyerror, usermissperm }
bot.fn = fn //I need to be able to access functions from the sharding manager

process.on('unhandledRejection', (reason) => {
    logger('error', 'bot.js', `Unhandled Rejection! Reason: ${reason.stack}`) });

process.on('uncaughtException', (reason) => {
    logger('error', 'bot.js', `Uncaught Exception! Reason: ${reason.stack}`) });


/* -------------- Load databases -------------- */
const settings = new nedb('./data/settings.db') //initialise database
settings.loadDatabase((err) => {
    if (err) return logger("error", "bot.js", "Error loading settings database. Error: " + err)
    logger("info", "bot.js", "Successfully loaded settings database.") }); //load db content into memory
bot.settings = settings; //add reference to bot obj

const timedbans = new nedb('./data/timedbans.db') //initialise database
timedbans.loadDatabase((err) => {
    if (err) return logger("error", "bot.js", "Error loading timedbans database. Error: " + err)
    logger("info", "bot.js", "Successfully loaded timedbans database.") }); //load db content into memory
bot.timedbans = timedbans; //add reference to bot obj

const timedmutes = new nedb('./data/timedmutes.db') //initialise database
timedmutes.loadDatabase((err) => {
    if (err) return logger("error", "bot.js", "Error loading timedmutes database. Error: " + err)
    logger("info", "bot.js", "Successfully loaded timedmutes database.") }); //load db content into memory
bot.timedmutes = timedmutes; //add reference to bot obj

const monitorreactions = new nedb('./data/monitorreactions.db') //initialise database
monitorreactions.loadDatabase((err) => {
    if (err) return logger("error", "bot.js", "Error loading monitorreactions database. Error: " + err)
    logger("info", "bot.js", "Successfully loaded monitorreactions database.") }); //load db content into memory
bot.monitorreactions = monitorreactions; //add reference to bot obj

/* ------------ Startup: ------------ */
bot.on("ready", async function() {
    if (bot.guilds.cache.array()[0] == undefined) return logger("warn", "bot.js", "This shard has no guilds and is therefore unused!");
    var thisshard = bot.guilds.cache.array()[0].shard //Get shard instance of this shard with this "workaround" because it isn't directly accessable

    //Set activity either to gameoverwrite or gamerotation[0]
    if (config.gameoverwrite != "" || (new Date().getDate() == 1 && new Date().getMonth() == 0)) { 
        let game = config.gameoverwrite
        if (new Date().getDate() == 1 && new Date().getMonth() == 0) game = `Happy Birthday beepBot!`

        bot.user.setPresence({activity: { name: game, type: config.gametype, url: config.gameurl }, status: config.status }).catch(err => { return logger("", "", "Woops! Couldn't set presence: " + err); })
    } else bot.user.setPresence({activity: { name: config.gamerotation[0], type: config.gametype, url: config.gameurl }, status: config.status }).catch(err => { return logger("", "", "Woops! Couldn't set presence: " + err); })

    if (thisshard.id == 0) {
        if (bootstart - Number(shardArgs[2]) < 10000) { //if difference is more than 10 seconds it must be a restart
            //Finish startup messages from controller.js
            logger("", "", `> ${commandcount} commands & ${Object.keys(bot.langObj).length} languages found!`, true)
            logger("", "", "> Successfully logged in shard0!", true)
            logger("", "", "*--------------------------------------------------------------*\n ", true)
        } else {
            logger("info", "bot.js", "shard0 got restarted...", false, true) }
    } else {
        logger("info", "bot.js", `Successfully logged in shard${thisshard.id}!`, false, true) }

    loggedin = true
    logafterlogin.forEach(e => {
        if (thisshard.id != 0 && e.includes("Successfully loaded") && e.includes("database")) return; //check if this message is a database loaded message and don't log it again
        logger("", "", e) });

    bot.commandcount = commandcount //probably useful for a few cmds so lets just add it to the bot obj (export here so the read process is definitely finished)
    
    setTimeout(() => {
        logger("", "", "", true, true) //Print empty line to clear other stuff
    }, 2500);
});

/* ------------ Event Handlers: ------------ */
bot.on("guildCreate", guild => {
    require("./events/guildCreate.js").run(bot, logger, guild) }) //call the run function of the file which contains the code of this event

bot.on("guildDelete", guild => {
    bot.shard.fetchClientValues("guilds.cache.size").then(res => { //wait for promise
        logger('info', 'bot.js', `I have been removed from: ${guild.name} (${guild.id}). I'm now in ${res} servers.`) })

    servertosettings(guild, true) }); //true argument will remove function from db

bot.on("guildMemberAdd", member => {
    require("./events/guildMemberAdd.js").run(bot, member) }) //call the run function of the file which contains the code of this event

bot.on("guildMemberRemove", member => {
    require("./events/guildMemberRemove.js").run(bot, member) }) //call the run function of the file which contains the code of this event

bot.on("messageReactionAdd", (reaction, user) => {
    require("./events/messageReactionAdd.js").run(bot, logger, reaction, user) }) //call the run function of the file which contains the code of this event

bot.on("voiceStateUpdate", (oldstate, newstate) => {
    require("./events/voiceStateUpdate.js").run(bot, oldstate, newstate) })

/* ------------ Message Handler: ------------ */
bot.on('message', (message) => {
    require("./events/message.js").run(bot, logger, message) }) //call the run function of the file which contains the code of this event

logger("info", "bot.js", "Logging in...", false, true)
bot.login() //Token is provided by the shard manager