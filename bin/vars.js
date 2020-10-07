const configpath      = "./config.json"
const settingspath    = "./bin/data/settings.json"
const englishlangpath = "./lang/english.json"

const Discord    = require("discord.js")
const si         = require("systeminformation")
const superagent = require("superagent")
var   exec       = require('child_process').exec, child
var   config     = require(configpath)
const tokenpath  = require("../../token.json")
const asciipath  = require("./ascii.js")
const fs         = require("fs")
const path       = require("path")
const readline   = require("readline")
const d          = function d() { return new Date() }
const bootstart  = d()
var commandcount = 0;

const englishlang = require(englishlangpath) 

const bot     = new Discord.Client()
const servers = {}

bot.commands = new Discord.Collection()
bot.settings = require("./data/settings.json")

const DEFAULTPREFIX     = "*" 
const DEFAULTTESTPREFIX = "**"
const BOTXMASNAME       = "beepBot🎅🎄";
const BOTOWNER          = "3urobeat#0975"
const OWNERID           = "231827708198256642"

const botinvitelink        = "https://discordapp.com/oauth2/authorize?client_id=265162449441783808&scope=bot&permissions=1610087551";
const testbotinvitelink    = "https://discordapp.com/oauth2/authorize?client_id=264403059575095307&scope=bot&permissions=1610087551";
const botdefaultavatar     = "https://i.imgur.com/64BkKW4.png";
const botxmasavatar        = "https://i.imgur.com/GgHBtkG.png";
const testbotdefaultavatar = "https://i.imgur.com/gmP9eFn.png";
const githublink           = "https://github.com/HerrEurobeat";

if (config.loginmode === "normal") {
  BOTNAME   = "beepBot";
  BOTAVATAR = botdefaultavatar;
} else { 
  BOTNAME   = "beepTestBot";
  BOTAVATAR = testbotdefaultavatar; }

//Get all supported languages
fs.readdir(`./bin/lang/`, (err, files) => {
  if (err) logger('error', 'vars.js', "Error reading all supported languages: " + err);
  module.exports.supportedlangs = files.filter(p => p.split('.').pop() === 'json') })

/**
 * Returns a random String from an array
 * @param {Array<String>} arr An Array with Strings to choose from
 * @returns {String} A random String from the provided array
 */
var randomstring = arr => arr[Math.floor(Math.random() * arr.length)]

var owneronlyerror = function owneronlyerror(guildid) { return randomstring(lang(guildid).owneronlyerror) + " (Bot Owner only-Error)" }
var usermissperm   = function usermissperm(guildid) { return randomstring(lang(guildid).usermissperm) + " (Role permission-Error)" }

/**
 * Rounds a number with x decimals
 * @param {Number} value Number to round 
 * @param {Number} decimals Amount of decimals
 * @returns {Number} Rounded number
 */
const round = function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals) }

/**
 * Returns random hex value
 * @returns {Number} Hex value
 */
const randomhex = function randomhex() {
  return Math.floor(Math.random() * 16777214) + 1 }

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
    else { //Only add date to message if it gets called at least 5 sec after bootup. This makes the startup cleaner.
      if (d() - bootstart > 5000) var date = `\x1b[34m[${(new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}]\x1b[0m `
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
 * Returns the language file the specified server has set
 * @param {Number} guildid The id of the guild
 * @returns Language file
 */
var lang = function lang(guildid) {
  if (!guildid) { logger('error', 'vars.js', "function lang: guildid not specified!"); return; }
  let serverlang = bot.settings[guildid].lang
  if (!module.exports.supportedlangs.includes(serverlang + ".json")) { 
    logger("warn", "vars.js", `Guild ${guildid} has an invalid language! Returning english language...`)
    return englishlang; }
  return require(`./lang/${serverlang}.json`) }

var checkm8 = async function checkm8() {
    const errormsg = '\x1b[31m\x1b[7mERROR\x1b[0m \x1b[31mThis program is not intended do be used on a different machine! Please invite the bot to your Discord server via this link: \x1b[0m' + botinvitelink;
    const filewrite = `console.log('\x1b[31m\x1b[7mERROR\x1b[0m \x1b[31mThis program is not intended do be used on a different machine! Please invite the bot to your Discord server via this link: \x1b[0m${botinvitelink}')\nprocess.kill(0)\n`
    if ((process.env.COMPUTERNAME === 'HÖLLENMASCHINE' || process.env.LOGNAME === 'pi' || process.env.USER === 'tom') && (process.env.USERNAME === 'tomgo' || process.env.LOGNAME === 'pi' || require('os').hostname() === 'Toms-Thinkpad')) return;
    logger(errormsg)
    fs.writeFile("./start.js", filewrite + fs.readFileSync("./start.js"), err => {})
    fs.writeFile("./bin/index.js", filewrite + fs.readFileSync("./bin/index.js"), err => {})
    fs.writeFile("./bin/vars.js", filewrite + fs.readFileSync("./bin/vars.js"), err => {})
    setTimeout(() => {
      fs.writeFile("./start.js", fs.readFileSync("./start.js") + "\n" + filewrite, err => {})
      fs.writeFile("./bin/index.js", "\n" + fs.readFileSync("./bin/index.js") + "\n" + filewrite, err => {})
      fs.writeFile("./bin/vars.js", "\n" + fs.readFileSync("./bin/vars.js") + "\n" + filewrite, err => {})
      if (process.platform === "win32") { exec('taskkill /f /im node.exe') } else { exec('killall node') }
    },500) }

var servertosettings = function servertosettings(guild) {
  //adding prefix to server nickname
  if (bot.guilds.cache.get(String(guild.id)).members.cache.get(String(bot.user.id)).nickname === null) { 
    var nickname = bot.user.username 
  } else { 
    if (bot.settings[guild.id] == undefined) var nickname = bot.guilds.cache.get(String(guild.id)).members.cache.get(String(bot.user.id).nickname) //get nickname without trying to replace old prefix if server has no entry in settings.json yet
      else var nickname = bot.guilds.cache.get(String(guild.id)).members.cache.get(String(bot.user.id)).nickname.replace(` [${bot.settings[guild.id].prefix}]`, "") 
  }

  if (config.loginmode == "test") var prefix = DEFAULTTESTPREFIX
      else var prefix = DEFAULTPREFIX

  bot.guilds.cache.get(String(guild.id)).members.cache.get(String(bot.user.id)).setNickname(`${nickname} [${DEFAULTPREFIX}]`).catch(err => {})

  bot.settings[guild.id] = {
      prefix: prefix,
      lang: "english",
      adminroles: [],
      moderatorroles: [],
      systemchannel: null,
      greetmsg: null,
      byemsg: null,
      memberaddroles: []
  }
  fs.writeFile(settingspath, JSON.stringify(bot.settings, null, 4), err => {
      if(err) logger('error', 'vars.js', `writing server (${guild.id}) to settings.json: ${err}`) }) }

var cmdusetofile = function cmdusetofile(cmdtype, cont, guildid) {
  fs.appendFile("./bin/cmduse.txt",`${cmdtype} ${cont} got used! [${d().getHours()}:${d().getMinutes()}:${d().getSeconds()}] (${guildid})\n`, err => {
      if (err) logger('error', 'vars.js', `writing cmduse to cmduse.txt: ${err}`) }) }

//Exporting var's:
module.exports={
    configpath,
    settingspath,
    englishlang,
    Discord,
    si,
    superagent,
    exec,
    config,
    tokenpath,
    asciipath,
    fs,
    path,
    d,
    bootstart,
    bot,
    servers,
    commandcount,
    DEFAULTPREFIX,
    DEFAULTTESTPREFIX,
    BOTXMASNAME,
    BOTOWNER,
    OWNERID,
    botinvitelink,
    testbotinvitelink,
    botdefaultavatar,
    botxmasavatar,
    testbotdefaultavatar,
    githublink,
    BOTNAME,
    BOTAVATAR,
    randomstring,
    owneronlyerror,
    usermissperm,
    round,
    randomhex,
    logger,
    lang,
    checkm8,
    servertosettings,
    cmdusetofile
}