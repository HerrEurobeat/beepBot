module.exports.run = async (bot, message, args) => {
    const v = require("../vars.js")
    
    try {
        const { body } = await v.superagent
        .get('https://animals.anidiots.guide/lion')
        var imageurl = body.link
        message.channel.send({embed:{
            title: imageurl,
            image: {
                url: imageurl
            },
            footer:{
                icon_url: message.author.displayAvatarURL,
                text: "Requestet by " + message.author.username
            },
            timestamp: message.createdAt,
            color: v.randomhex()
        }})
    } catch (err) {
        console.log("lion API Error: " + err)
        message.channel.send("lion API Error: " + err)
    }

}

module.exports.config = {
    command: "lion"
}