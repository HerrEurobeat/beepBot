﻿console.log(" ")
const v = require("./bin/vars.js")
var bootstart = new Date();
console.log("Loading...")

//Functions:
function avatarinterval() {
    if (v.d.getMonth() == 11) {
        v.bot.user.setUsername(v.BOTXMASNAME).catch(err => {
            console.warn(v.LOGWARN + "Username Fail. Probably changing too fast.") })
        v.bot.user.setAvatar(v.botxmasavatar).catch(err => {
            console.log(v.LOGWARN + "Avatar fail. Probably changing too fast.") })
    }else{
        v.bot.user.setUsername(BOTNAME).catch(err => {
            console.warn(v.LOGWARN + "Username Fail. Probably changing too fast.") })
        v.bot.user.setAvatar(botavatar).catch(err => {
            console.log(v.LOGWARN + "Avatar fail. Probably changing too fast.") })
    }
}

function botstartupmode() {
    if (v.botloginmode === "normal") {
        var TOKEN = v.botconfig.token;
        v.bot.login(TOKEN)
    } else if (v.botloginmode === "test") {
        var TOKEN = v.botconfig.testtoken;
        v.bot.login(TOKEN)
    } else {
        console.log(v.LOGWARN + "Error logging in.")
        return;
    }
}

async function voiceunmute(voiceunmuteMember) {
    voiceunmuteMember.setMute(false).then(member => {
        }).catch(err => {
            console.log("An error occured: " + err)
        })
}

async function chatunmute(chatunmuteMember, chatmutedRole) {
    if (!chatmutedRole) {
        console.log("The 'beepBot Muted' role does not exist on this server.")
        return;
    }
    await chatunmuteMember.removeRole(chatmutedRole.id).catch(err => {
        console.log("Error: " + err)
    })
}

async function unban(banguild, unbanMember) {
    banguild.unban(unbanMember).catch(err => {
        console.log("Error: " + err)
    })
}

if (v.botloginmode === "test") { 
    var PREFIX = "**";
    var BOTNAME = "beepTestBot";
    if (v.botconfig.game === v.DEFAULTGAME) {
        var GAME = "testing beepBot...";
    } else {
        var GAME = v.botconfig.game
    }
    var botavatar = v.testbotdefaultavatar;
    var botinvite = v.testbotinvitelink;
} else {
    var PREFIX = v.botconfig.prefix;
    var BOTNAME = "beepBot";
    var GAME = v.botconfig.game;
    var botavatar = v.botdefaultavatar;
    var botinvite = v.botinvitelink;
}

//BOT Startup
v.bot.on("ready", async function() {

    console.log(" ")
    console.log("*---------------------*")
    if (v.botloginmode === "normal") { console.log("Started " + BOTNAME + " " + v.BOTVERSION + " by " + v.BOTOWNER + " in " + v.botloginmode + " mode.") } 
    if (v.botloginmode === "test") { console.log("Started " + BOTNAME + " " + v.BOTVERSION + " by " + v.BOTOWNER + " in *" + v.botloginmode + "ing mode.*") }
    v.bot.user.setGame(GAME);
    v.bot.user.setStatus(v.STATUS).catch(err => {
        console.log("Status fail. Probably changing too fast.")
    })
    if (v.os.platform == "linux") console.log("I'm running on Linux...") 
    if (v.os.platform == "win32") console.log("I'm running on Windows...")

    console.log("Time: " + v.d)

    //Checks if it is christmas and changes avatar & username at startup and then every 1 hour.
    avatarinterval();

    v.bot.setInterval(() => {
        avatarinterval();
        console.log(v.LOGINFO + "6 hours passed, updated name and avatar.")
    }, 3600 * 6000); //1 hour in seconds to 6 hours in milliseconds.

    //Command reader
    v.fs.readdir('./bin/commands/', (err, files) => {
        if (err) console.error(err);
        
        var jsfiles = files.filter(f => f.split('.').pop() === 'js');
        if (jsfiles.length <= 0) { return console.log("No commands found...")}
        else { console.log("-> " + jsfiles.length + " commands found.") }
        
        jsfiles.forEach((f, i) => {
            var cmds = require(`./bin/commands/${f}`);
            v.bot.commands.set(cmds.config.command, cmds);
            v.bot.alias.set(cmds.config.alias, cmds)
            v.bot.alias2.set(cmds.config.alias2, cmds)
        })
        
        console.log("Playing status was set to: " + GAME)
        var gameloop = 0;

        if (v.botconfig.musicenable === "true" && v.os.platform == "win32") {
            console.log("*Music feature is enabled!*")
        }
        var bootend = new Date() - bootstart
        console.info("The Bot is ready after %dms!", bootend);
        console.log("*---------------------*")
        console.log(" ")

        //Mute and Ban checker:
        v.bot.setInterval(() => {
            for(let i in v.bot.chatmutes) {
                let chattime = v.bot.chatmutes[i].time;
                let chatguildId = v.bot.chatmutes[i].guild;
                let chatmuteauthorId = v.bot.chatmutes[i].muteauthor;
                let chatmutechannelId = v.bot.chatmutes[i].mutechannel;
                let chatrawmuteduration = v.bot.chatmutes[i].rawmuteduration;
                let chatmutedurationtype = v.bot.chatmutes[i].mutedurationtype;

                let chatguild = v.bot.guilds.get(chatguildId);
                let chatunmuteMember = chatguild.members.get(i);
                let chatmutedRole = chatguild.roles.find(r => r.name === "beepBot Muted");
                let chatchannel = chatguild.channels.find("id", chatmutechannelId)
                let chatmuteauthor = chatguild.members.find("id", chatmuteauthorId)
                if (!chatmutedRole) continue;

                if (Date.now() > chattime) {
                    if (chatunmuteMember === undefined) {
                        delete v.bot.chatmutes[i];
                        v.fs.writeFile(v.chatmutespath, JSON.stringify(v.bot.chatmutes), err => {
                            if (err) console.log("Error: " + err)
                        })
                        return;
                    }
                    chatunmute(chatunmuteMember, chatmutedRole)
                    chatchannel.send(chatunmuteMember + " was chat-unmuted after " + chatrawmuteduration + " " + chatmutedurationtype + " by " + chatmuteauthor + ".")
                    
                    delete v.bot.chatmutes[i];
                    v.fs.writeFile(v.chatmutespath, JSON.stringify(v.bot.chatmutes), err => {
                        if (err) console.log("Error: " + err)
                    })
                }
            }
        }, 5000)
        
        v.bot.setInterval(() => {
            for(let i in v.bot.voicemutes) {
                let voicetime = v.bot.voicemutes[i].time;
                let voiceguildId = v.bot.voicemutes[i].guild;
                let voicemuteauthorId = v.bot.voicemutes[i].muteauthor;
                let voicemutechannelId = v.bot.voicemutes[i].mutechannel;
                let voicerawmuteduration = v.bot.voicemutes[i].rawmuteduration;
                let voicemutedurationtype = v.bot.voicemutes[i].mutedurationtype;

                let voiceguild = v.bot.guilds.get(voiceguildId);
                let voiceunmuteMember = voiceguild.members.get(i);
                let voicechannel = voiceguild.channels.find("id", voicemutechannelId)
                let voicemuteauthor = voiceguild.members.find("id", voicemuteauthorId)

                if (Date.now() > voicetime) {
                    if (voiceunmuteMember === undefined) {
                        delete v.bot.voicemutes[i];
                        v.fs.writeFile(v.voicemutespath, JSON.stringify(v.bot.voicemutes), err => {
                            if (err) message.channel.send("Error: " + err)
                        })
                        return;
                    }
                    voiceunmute(voiceunmuteMember)
                    if (!voiceunmuteMember.voiceChannel) {
                        voicemuteauthor.send(voiceunmuteMember + " is now able to get voice-unmuted after " + voicerawmuteduration + " " + voicemutedurationtype + ". I can't unmute him if he is not in a voice channel so please do that yourself. Thanks! :)")
                    } else {
                        voicechannel.send(voiceunmuteMember + " was voice-unmuted after " + voicerawmuteduration + " " + voicemutedurationtype + " by " + voicemuteauthor + ".")
                    }

                    delete v.bot.voicemutes[i];
                    v.fs.writeFile(v.voicemutespath, JSON.stringify(v.bot.voicemutes), err => {
                        if (err) message.channel.send("Error: " + err)
                    })
                }
            }
        }, 5000)

        v.bot.setInterval(() => {
            for(let i in v.bot.bans) {
                let banname = v.bot.bans[i].name;
                let bantime = v.bot.bans[i].time;
                let banguildId = v.bot.bans[i].guild;
                let banauthorId = v.bot.bans[i].banauthor;
                let banchannelId = v.bot.bans[i].banchannel;
                let rawbanduration = v.bot.bans[i].rawbanduration;
                let bandurationtype = v.bot.bans[i].bandurationtype;
                let banreasontext = v.bot.bans[i].banreason;

                let banguild = v.bot.guilds.get(banguildId);
                let unbanMember = i;
                let banchannel = banguild.channels.find("id", banchannelId)
                let banauthor = banguild.members.find("id", banauthorId)

                if (Date.now() > bantime) {

                    unban(banguild, unbanMember)
                    banchannel.send(banauthor + ": The user @" + banname + " was unbanned after " + rawbanduration + " " + bandurationtype + ". __Ban-Reason:__ " + banreasontext)

                    delete v.bot.bans[i];
                    v.fs.writeFile(v.banspath, JSON.stringify(v.bot.bans), err => {
                        if (err) message.channel.send("Error2: " + err)
                    })
                }
            }
        }, 5000)

        module.exports ={ 
            bootend,
            BOTNAME,
            PREFIX,
            botavatar,
            botinvite,
            GAME
        }
    });

    v.bot.setInterval(() => {
        if (v.botconfig.game === v.DEFAULTGAME) {
            if (gameloop === 0) {
                console.log("gameloop 0")
                v.bot.user.setGame("test 1")
                var gameloop = 1;
                return;
            }
            if (gameloop === 1) {
                console.log("gameloop 2")
                v.bot.user.setGame("test 2")
                var gameloop = 2;
                return;
            }
            if (gameloop === 2) {
                console.log("gameloop default")
                v.bot.user.setGame(GAME)
                var gameloop = 0;
                return;
            }
        } else {
            console.log("Custom game")
        }
    }, 5000)

});

//Events
v.bot.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    if (guild.systemChannelID == null) {
        return;
    } else {
        guild.channels.find("id", guild.systemChannel.id).send("Hi im " + BOTNAME + " Version " + v.BOTVERSION + " by " + v.BOTOWNER + ". Get a list of my commands with `" + PREFIX + "help`. Type `" + PREFIX + "invite` to get an invite link.").catch(err => {
        })
    }
    guild.owner.send("Hi im " + BOTNAME + " Version " + v.BOTVERSION + " by " + v.BOTOWNER + ".\nThanks for adding me to your server! To get a overlook of all my commands just type `" + PREFIX + "help`.\nThe greeting feature is enabled when a greeting channel is set in the server settings.\nIf you need help or something else join my server with `" + PREFIX + "invite!`\nHave fun!")
});

v.bot.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    guild.owner.send("You removed me from your server :( ... \nIf you want me to come back just type `" + PREFIX + "invite` and i would be glad to be back!\nIf something didn't work out as you wanted let it me know on my server!\nhttps://discord.gg/q3KXW2P")
});

v.bot.on("guildMemberAdd", async function(member) {
    // When a user joins the server message
    if (member.guild.systemChannelID == null) {
        return;
    } else {
        if (member.guild.members.size > 250) {
            member.guild.channels.find("id", member.guild.systemChannel.id).send(member.user.username + ": Welcome on **" + member.guild.name + "**! :) Get all of my commands with `" + PREFIX + "help`!").catch(err => {
            })
        } else {
            member.guild.channels.find("id", member.guild.systemChannel.id).send(member.toString() + " Welcome on **" + member.guild.name + "**! :) Get all of my commands with `" + PREFIX + "help`!").catch(err => {
            })
        }  
    }

    if (!member.guild.id === 231828052127121408) {
        return; }
    if (!member.guild.id === 232550371191554051) {
        return; }
    if (member.user.bot) {
        member.addRole(member.guild.roles.find("name", "Bot's")).catch(err => {
        })
    } else {
        member.addRole(member.guild.roles.find("name", "Member")).catch(err => {
        })
    }
});

v.bot.on("guildMemberRemove", function(member) {
    // When a user leaves the server direct message
    var options = {
        maxAge: false
    }
    if (member.guild.systemChannelID == null) {

    } else {
        if (member.guild.members.size > 250) {
            member.guild.channels.find("id", member.guild.systemChannel.id).send(member.user.username + " left **" + member.guild.name + "**! :(").catch(err => {
            })
        } else {
            member.guild.channels.find("id", member.guild.systemChannel.id).send(member.toString() + " left **" + member.guild.name + "**! :(").catch(err => {
            })
            var invite = member.guild.channels.find("id", member.guild.channels.find("position", 1).id).createInvite(options).then(function(newInvite) {
                member.send("Sadly you left **" + member.guild.name + "**. To join again use this link: https://discord.gg/" + newInvite.code).catch(err => {
                    console.log("Error: " + err)
                })
            })
        }
    }
});

v.bot.on("guildUnavailable", function(guild) {
    // When a guild becomes unavailable, likely due to a server outage
    guild.owner.send("Your server **" + guild.name + "** has become unavailable just in this moment. This can be caused by a server outage. For more information check the Discord Server Status: https://status.discordapp.com/")
});

v.bot.on("error", (e) => console.error(e));
v.bot.on("warn", (e) => console.warn(e));
if (v.botconfig.debug === "true") {
    v.bot.on("debug", (e) => console.info(e));
}

//Command/Message Handler
v.bot.on("message", async function(message) {
    if (message.author.bot) return;

/*     if (message.mentions.users.first().id === v.bot.user.id) {
        await message.react("🇭")
        await message.react("🇮")
    } */

    if (!message.content.startsWith(PREFIX)) return;

    var cont = message.content.slice(PREFIX.length).split(" ");
    var args = cont.slice(1);
    
    var cmd = v.bot.commands.get(cont[0].toLowerCase())
    var alias = v.bot.alias.get(cont[0].toLowerCase())
    var alias2 = v.bot.alias2.get(cont[0].toLowerCase())

    if (cmd) { 
        cmd.run(v.bot, message, args); 
        return;
         
    } else if (alias) {
        alias.run(v.bot, message, args);
        return;

    } else if (alias2) {
        alias2.run(v.bot, message, args);
        return;

    } else {
        if(message.content.includes(PREFIX + "*")) return;            
        if(message.content.endsWith(PREFIX)) return;
        //Disabled the message because of disturbing.
        if (message.channel.type === "dm") {
            message.channel.send(v.wrongcmd())
        }
        return;
    }
    //The command reader in the 'ready' event imports the commands.
});

botstartupmode();