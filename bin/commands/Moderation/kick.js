module.exports.run = async (bot, message, args, lang, logger, guildsettings, fn) => { 
    var kickuser = fn.getuserfrommsg(message, args, false);
    if (Object.keys(kickuser).length == 0) return message.channel.send(lang.general.usernotfound);

    if (message.guild.owner && message.guild.owner.id !== message.author.id && message.guild.members.cache.get(kickuser.id).roles.highest.position >= message.member.roles.highest.position) {
        message.channel.send(lang.cmd.kick.highestRoleError)
        message.react("❌").catch(() => {}) //catch but ignore error
        return; }

    if (kickuser.id == bot.user.id) return message.channel.send(fn.randomstring(lang.cmd.kick.botkick))
    if (kickuser.id == message.author.id) return message.channel.send(lang.cmd.kick.selfkick)

    if (message.guild.members.cache.get(kickuser.id).roles.highest.position >= message.guild.members.cache.get(bot.user.id).roles.highest.position) {
        return message.channel.send(lang.cmd.kick.botRoleTooLow) }

    var kickreason, kickreasontext = ""
    var notargs1 = ["-notify", "-n", undefined] //things the next check shouldn't be

    if (!notargs1.includes(args[1])) { //args[1] isn't something from the array
        let newargs = [ ...args ] //make a copy of the original array because splice would modify it
        if (newargs.includes("-n")) newargs.splice(newargs.indexOf("-n"), 1)
                else if (newargs.includes("-notify")) newargs.splice(newargs.indexOf("-notify"), 1)
        
        kickreason, kickreasontext = newargs.slice(1).join(" ")
    } else { 
        kickreasontext = "/" 
        kickreason = undefined }

    //Checks user perms and kick
    if (message.member.permissions.has("KICK_MEMBERS", "ADMINISTRATOR")) {
        message.guild.members.cache.get(kickuser.id).kick(kickreason).then(() => {
            message.channel.send(lang.cmd.kick.kickmsg.replace("username", kickuser.username).replace("kickreasontext", kickreasontext))
            message.react("✅").catch(() => {}) //catch but ignore error
            fn.msgtomodlogchannel(message.guild, "kick", message.author, kickuser, [kickreasontext, message.content.includes("-notify") || message.content.includes("-n")]) //details[1] results in boolean
            
            if (message.content.includes("-notify") || message.content.includes("-n")) {
                if (!kickuser.bot) kickuser.send(lang.cmd.kick.kicknotifymsg.replace("servername", message.guild.name).replace("kickreasontext", kickreasontext)).catch(err => {
                    message.channel.send(lang.general.dmerr + err) }) }
        }).catch(err => {
            message.channel.send(`${lang.general.anerroroccurred} ${err}`)
            message.react("❌").catch(() => {}) }) //catch but ignore error
    } else {
        message.channel.send(fn.usermissperm(lang)) }
}

module.exports.info = {
    names: ["kick"],
    description: "cmd.kick.infodescription",
    usage: "(mention/username) [reason] [-notify/-n]",
    accessableby: ['moderators'],
    allowedindm: false,
    nsfwonly: false
}