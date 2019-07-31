module.exports.run = async (bot, message, args) => {
    const v = require("../vars.js")
    const index = require("../index.js")

    var randomcolor = v.randomhex()

    if (args[0] === undefined) {
        message.channel.send({embed:{
            author: {
                name: index.BOTNAME,
                icon_url: bot.user.avatarURL,
                url: v.botinvitelink
            },
            description: "Random color: #" + randomcolor,
            color: randomcolor
            }}).catch(err => {
                console.log("color random color embed message error: " + err)
            })
        } else {
            var wantedcolor = args[0]
            switch(args[0].toLowerCase()) {
                case "colors":
                    message.channel.send("Supported predefined colors: black, gray, red, green, blue, yellow, purple, gold, cyan, white, pink, orange.\nDisplay a color with *color (predefined color)\nGet a random color by just typing *color")
                    return;
                case "black":
                    var wantedcolor = 0x000000
                    break;
                case "gray":
                    var wantedcolor = 0x808080
                    break;
                case "red":
                    var wantedcolor = 0xFF0000
                    break;
                case "green":
                    var wantedcolor = 0x00FF00
                    break;
                case "blue":
                    var wantedcolor = 0x0000FF
                    break;
                case "yellow":
                    var wantedcolor = 0xFFFF00
                    break;
                case "purple":
                    var wantedcolor = 0x800080
                    break;
                case "gold":
                    var wantedcolor = 0xFFD700
                    break;
                case "cyan":
                    var wantedcolor = 0x00FFFF
                    break;
                case "white":
                    var wantedcolor = 0xFFFFFF
                    break;
                case "pink":
                    var wantedcolor = 0xFFC0CB
                    break;
                case "orange":
                    var wantedcolor = 0xFFA500
                    break;
                default:
                    message.channel.send('To get a random color just type: `*color`\nSee all predefined colors with `*color colors`\nSee the color code of a predefined color with `*color red` (example)')
                    return;
            }
            
            message.channel.send({embed:{
                author: {
                    name: index.BOTNAME,
                    icon_url: bot.user.avatarURL,
                    url: v.botinvitelink
                },
                description: "Your color: #" + wantedcolor,
                color: wantedcolor
                }}).catch(err => {
                    console.log("color send specified color message error: " + err)
                    return;
                })
        }
    }

module.exports.config = {
    command: "randomcolor",
    alias: "color"
}