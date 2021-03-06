//This file contains code of the getreasonfrommsg function and is called by bot.js
//I did this to reduce the amount of lines in bot.js to make finding stuff easier.

module.exports.run = (args, stoparguments, callback) => {
    var searchfor = ""
    let startindex = args.indexOf("-r") + 1
    if (startindex == 0) return callback(undefined, "/") //seems like no reason was provided

    args.every((e, i) => {
        if (i < startindex) return true; //we don't need to start yet so lets skip the iteration

        if (searchfor.length > 0) searchfor += ` ${e}` //if there is already something in the string add a space infront this entry
            else searchfor += e
        
        if (stoparguments.includes(args[i + 1]) || i + 1 > args.length - 1) { //check if next iteration would match a stoparg or it would exceed the array length
            callback(searchfor, searchfor)

            return false; //stop loop
        } else {
            return true; //continue with next iteration
        } 
    }) }