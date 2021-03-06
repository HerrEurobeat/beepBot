module.exports.run = async (bot, message, args, lang, logger, guildsettings, fn) => { //eslint-disable-line
    const lf         = lang.cmd.info
    const si         = require("systeminformation")
    const Discord    = require("discord.js")
    var infofields   = []
    var thumbnailurl = ""

    //Small function to avoid repeating code
    function quickInfoField(index, name, value, inline) {
        return infofields[index] = {
            name: lf[name],
            value: String(lf[value]).replace("prefix", guildsettings.prefix),
            inline: inline
        } }

    if (!args[0]) { args[0] = "" }
    if (!args[1]) { args[1] = "" }
    switch(args[0].toLowerCase()) {
        case "user":
            if (!args[1] || message.channel.type == "dm") var whichuser = message.author
            else if (message.guild.members.cache.find(member => member.user.username == args[1])) var whichuser = message.guild.members.cache.find(member => member.user.username == args[1]).user
            else if (message.guild.members.cache.find(member => member.nickname == args[1])) var whichuser = message.guild.members.cache.find(member => member.nickname == args[1]).user
            else if (message.guild.members.cache.get(args[1])) var whichuser = message.guild.members.cache.get(args[1]).user
            else if (message.mentions.users.first()) var whichuser = message.mentions.users.first()
            else return message.channel.send(lf.usernotfound)

            thumbnailurl = whichuser.displayAvatarURL()
            var alluseractivites = ""
            var usernickname = ""

            whichuser.presence.activities.forEach((e, i) => {
                if (i == 0) alluseractivites += `${e.name}`
                    else alluseractivites += `, ${e.name}`

                if (i + 1 == Object.keys(whichuser.presence.activities).length && alluseractivites.length >= 25) { 
                    alluseractivites = alluseractivites.slice(0, 25) + "..." } })

            if (message.channel.type == "dm" || message.guild.members.cache.get(whichuser.id).nickname == null) usernickname = "/"
                    else usernickname = message.guild.members.cache.get(whichuser.id).nickname

            if (args[1].toLowerCase() == "mobile") { //Provide mobile option because the other version looks way nicer on Desktop but is completely screwed over on mobile
                //Mobile version
                infofields[0] = {
                    name: lf.user,
                    value: `**${lf.username}:** ${whichuser.name}#${whichuser.discriminator}\n` +
                           `**${lf.nickname}:** ${usernickname}\n` +
                           `**${lf.status}:** ${whichuser.presence.status}\n` +
                           `**${lf.games}:** (${Object.keys(whichuser.presence.activities).length}) ${alluseractivites}\n` +
                           `**${lf.id}:** ${whichuser.id}\n` +
                           `**${lf.creationdate}:** ${(new Date(whichuser.createdAt - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`,
                    inline: true }
                
                quickInfoField(1, "bot", "botshowmore", false)
                quickInfoField(2, "server", "servershowmore", false)
            } else {
                //Desktop version
                infofields[0] = {
                    name: lf.user,
                    value: `${lf.username}:\n` +
                           `${lf.nickname}:\n` +
                           `${lf.status}:\n` +
                           `${lf.games}: (${Object.keys(whichuser.presence.activities).length})\n` +
                           `${lf.id}:\n` +
                           `${lf.creationdate}:`,
                    inline: true }

                infofields[1] = {
                    name: "\u200b",
                    value: `${whichuser.username}#${whichuser.discriminator}\n` +
                           `${usernickname}\n` +
                           `${whichuser.presence.status}\n` +
                           `${alluseractivites}\n` +
                           `${whichuser.id}\n` +
                           `${(new Date(whichuser.createdAt - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`,
                    inline: true }

                infofields[2] = {
                    name: "\u200b",
                    value: "\u200b" }

                quickInfoField(3, "bot", "botshowmore", true)
                quickInfoField(4, "server", "servershowmore", true) }
            break;
        case "server":
            if (message.channel.type == "dm") return message.channel.send(lf.serverdmerror)

            thumbnailurl = message.guild.iconURL()

            if (args[1].toLowerCase() == "mobile") {
                //Mobile version
                infofields[0] = {
                    name: lf.server,
                    value: `**${lf.name}:** ${message.guild.name}\n` +
                           `**${lf.id}:** ${message.guild.id}\n` +
                           `**${lf.owner}:** ${message.guild.owner}\n` +
                           `**${lf.usercount}:** ${message.guild.members.cache.size}\n` +
                           `**${lf.channelid}:** ${message.channel.id}\n` +
                           `**${lf.serverregion}:** ${message.guild.region}\n` +
                           `**${lf.shardid}:** ${message.guild.shardID}\n` +
                           `**${lf.creationdate}:** ${(new Date(message.guild.createdAt - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`,
                    inline: true }

                quickInfoField(1, "bot", "botshowmore", false)
                quickInfoField(2, "user", "usershowmore", false)
            } else {
                //Desktop version
                infofields[0] = {
                    name: lf.server,
                    value: `${lf.name}:\n` +
                           `${lf.id}:\n` +
                           `${lf.owner}:\n` +
                           `${lf.usercount}:\n` +
                           `${lf.channelid}:\n` +
                           `${lf.serverregion}:\n` +
                           `${lf.shardid}:\n` +
                           `${lf.creationdate}:`,
                    inline: true }

                infofields[1] = {
                    name: "\u200b",
                    value: `${message.guild.name}\n` +
                           `${message.guild.id}\n` +
                           `${message.guild.owner}\n` +
                           `${message.guild.members.cache.size}\n` +
                           `${message.channel.id}\n` +
                           `${message.guild.region}\n` +
                           `${message.guild.shardID}\n` +
                           `${(new Date(message.guild.createdAt - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, ' ').replace(/\..+/, '')}`,
                    inline: true }

                infofields[2] = {
                    name: "\u200b",
                    value: "\u200b" }

                quickInfoField(3, "bot", "botshowmore", true)
                quickInfoField(4, "user", "usershowmore", true) }
            break;
        default:
            thumbnailurl = bot.user.displayAvatarURL()
            var cpuTemp = await si.cpuTemperature(async (cb) => { return cb })
            var cpuUsage = await si.currentLoad(async (cb) => { return cb })
            if (cpuTemp.main == -1) cpuTemp.main = "/" //si can't read temp

            if (args[1].toLowerCase() == "mobile") {
                //Mobile version
                infofields[0] = {
                    name: `**${lf.bot}** - Mobile`,
                    value: `**${lf.uptime}:** ${fn.round(bot.uptime / 3600000, 2)} hours\n` +
                           `**${lf.heartbeat}:** ${fn.round(bot.ws.ping, 2)} ms\n` +
                           `**${lf.ramusage}:** ${Math.round(process.memoryUsage()["rss"] / 1024 / 1024 * 100) / 100} MB (RSS)\n` +
                           `**${lf.cputemp}:** ${bot.fn.round(cpuTemp.main, 2)} °C\n` +
                           `**${lf.cpuusage}:** ${fn.round(cpuUsage.currentload, 2)} %\n` +
                           `**${lf.nodejsversion}:** ${process.version.replace("v", "")}\n` +
                           `**${lf.discordjsversion}:** v${Discord.version}\n` +
                           `**${lf.servercount}:** ${(await bot.shard.fetchClientValues("guilds.cache.size")).reduce((a, b) => b + a)}\n` +
                           `**${lf.shardcount}:** ${bot.shard.count}\n` +
                           `**${lf.inviteme}:** [Click here!](${bot.constants.botinvitelink})\n`,
                    inline: true }

                quickInfoField(3, "user", "usershowmore", false)
                quickInfoField(4, "server", "servershowmore", false)
            } else {
                //Desktop version
                infofields[0] = {
                    name: lf.bot,
                    value: `${lf.uptime}:\n` +
                           `${lf.heartbeat}:\n` +
                           `${lf.ramusage}:\n` +
                           `${lf.cputemp}:\n` +
                           `${lf.cpuusage}:\n` +
                           `${lf.nodejsversion}:\n` +
                           `${lf.discordjsversion}:\n` +
                           `${lf.servercount}:\n` +
                           `${lf.shardcount}:\n` +
                           `${lf.inviteme}:\n`,
                    inline: true }

                infofields[1] = {
                    name: "\u200b",
                    value: `${fn.round(bot.uptime / 3600000, 2)} hours\n` +
                           `${fn.round(bot.ws.ping, 2)} ms\n` +
                           `${Math.round(process.memoryUsage()["rss"] / 1024 / 1024 * 100) / 100} MB (RSS)\n` +
                           `${bot.fn.round(cpuTemp.main, 2)} °C\n` +
                           `${fn.round(cpuUsage.currentload, 2)} %\n` +
                           `${process.version}\n` +
                           `v${Discord.version}\n` +
                           `${(await bot.shard.fetchClientValues("guilds.cache.size")).reduce((a, b) => b + a)}\n` +
                           `${bot.shard.count}\n` +
                           `[Click here!](${bot.constants.botinvitelink})`,
                    inline: true }

                infofields[2] = {
                    name: "\u200b",
                    value: "\u200b",
                    inline: true } 
                
                quickInfoField(3, "user", "usershowmore", true)
                quickInfoField(4, "server", "servershowmore", true) }
    }

    message.channel.send({ 
        embed: {
            title: `${bot.constants.BOTNAME} - ${lf.info}`,
            color: fn.randomhex(),
            thumbnail: { url: thumbnailurl },
            description: `${bot.constants.BOTNAME} version ${bot.config.version} made by ${bot.constants.BOTOWNER}\n${bot.constants.githublink}`,
            fields: infofields,
            footer: { icon_url: message.author.displayAvatarURL(), text: `${lang.general.requestedby} ${message.author.username} • ${lf.footermobilemsg.replace("prefix", guildsettings.prefix)}` }
        }
    })
    
}

module.exports.info = {
    names: ["info"],
    description: "cmd.info.infodescription",
    usage: '["bot"/"user"/"server"] ["mobile"]',
    accessableby: ['all'],
    allowedindm: true,
    nsfwonly: false
}