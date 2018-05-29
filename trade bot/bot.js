const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const TeamFortress2 = require('tf2');
 
 
const Prices = require('./prices.json');
const config = require('./config.json');
 
const client = new SteamUser();
const tf2 = new TeamFortress2(client);
const community = new SteamCommunity();
const manager = new TradeOfferManager ({
    steam: client,
    community: community,
    language: 'en'
});
 
const logOnOptions = {
    accountName: config.username,
    password: config.password,
    twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
};
 
client.logOn(logOnOptions);
 
    console.log('succesfully logged on.');
client.on('loggedOn', () => {
    client.setPersona(SteamUser.Steam.EPersonaState.Online);
    client.gamesPlayed(["Looking to trade"]);
});
 
client.on("friendMessage", function(steamID, message) {
    if (message == "!cmds") {
        client.chatMessage(steamID, "List: !help - Information about this bot; !offer - Trade Offer information; !terms - See the terms of Service");
    }
    if (message == "hi") {
        client.chatMessage(steamID, "Hello, use the command: !help for more information.");
    }
    if (message == "!help") {
        client.chatMessage(steamID, "Hello. This is DrSocky's 24/7 Trading Bot. In order to use this bot, you must accept the Terms of Service. More information will be provided by the following command: !terms. This bot will be able to trade as of January 5th. Use !cmds for a list of commands. This bot was created on December 20th. If you found an exploit/glitch in my program, please contact me also as you will get a reward. If there is an item you want to buy or sell that is not on a backpack.tf listing, do the command !offer for more information. Any questions? Contact me...https://steamcommunity.com/id/bubbajrr");
    }
    if (message == "!offer") {
        client.chatMessage(steamID, "Trade Link: https://steamcommunity.com/tradeoffer/new/?partner=837455464&token=xcdWij7y. If there is an item you want that is not in my inventory, please send me a message. Please keep in mind if you want a special request, there will be a 2 scrap inconvenience fee.");
    }
    if (message == "!terms") {
        client.chatMessage(steamID, "Terms of Use: https://docs.google.com/document/d/14trE_aW5eGPpAWXuxQoyZv2vNTHTmcsZFix-eac0u_4/edit?usp=sharing Please follow all of the directions to be able to trade this bot.")
    }
});
client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies);
 
    community.setCookies(cookies);
    community.startConfirmationChecker(20000, config.identitySecret);
});
 
function acceptOffer(offer) {
    offer.accept((err) => {
        community.checkConfirmations();
        console.log("We Accepted an offer");
        if (err) console.log("There was an error accepting the offer.");
    });
}
 
function declineOffer(offer) {
    offer.decline((err) => {
        console.log("We Declined an offer");
        if (err) console.log("There was an error declining the offer.");
    });
}
 
function processOffer(offer) {
    if (offer.isGlitched() || offer.state === 11) {
        console.log("Offer was glitched, declining.");
        declineOffer(offer);
    } else if (offer.partner.getSteamID64() === config.ownerID) {
        acceptOffer(offer);
    } else {
        var ourItems = offer.itemsToGive;
        var theirItems = offer.itemsToReceive;
        var ourValue = 0;
        var theirValue = 0;
        for (var i in ourItems) {
            var item = ourItems[i].market_name;
            if(Prices[item]) {
                ourValue += Prices[item].sell;
            } else {
                console.log("Invalid Value.");
                ourValue += 99999;
            }
        }
        for(var i in theirItems) {
            var item= theirItems[i].market_name;
            if(Prices[item]) {
                theirValue += Prices[item].buy;
            } else {
            console.log("Their value was different.")
            }
        }
   
    console.log("Our value: "+ourValue);
    console.log("Their value: "+theirValue);
 
    if (ourValue <= theirValue) {
        acceptOffer(offer);
    } else {
        declineOffer(offer);
    }
    }
}
 
client.setOption("promptSteamGuardCode", false);
 
manager.on('newOffer', (offer) => {
     processOffer(offer);
});
 
/* Crafting */
 
var scrapAmt = 25;
var pollCraft = 30;
 
tf2.on('connectedToGC', function() {
    console.log("Connected to tf2 game server.");
});
 
tf2.on('backpackLoaded', function () {
    console.log("Loaded our backpack.");
});
 
function craftS(amtNeedScrap) {
    if (tf2.backpack == undefined) {
        console.log("unable to load backpack, can't craft.");
        return
    } else {
        console.log("attempting to craft...");
        var amtOfScrap = 0;
        for (var i = 0; i <tf2.backpack.length; i++) {
            if (tf2.backpack[i].defIndex === 5000) {
                amtOfScrap++;
            }
        }
        for (var i = 0; i <tf2.backpack.length; i++) {
            if (tf2.backpack[i].defIndex === 5002) {
                amtOfScrap +=9;
                var beep = new Array;
                beep.push(parseInt(tf2.backpack[i].id));
                tf2.craft(beep);
 
    } else if (tf2.backpack[i].defIndex === 5001) {
                amtOfScrap +=3;
                var beep = new Array;
                beep.push(parseInt(tf2.backpack[i].id));
                tf2.craft(beep);
            }
            if (amtOfScrap >= amtNeedScrap) {
                break;
            }
        }
           
 
    }
}
 
tf2.on('craftingComplete', function(e) {
    console.log("Finished crafting.");
});
 
client.on('friendMessage#'+config.ownerID, function(steamID, message) {
    if (message == "craft") {
        craftS(scrapAmt);
        console.log("Recieved order to craft from admin.")
    } else {
        console.log("craft error.")
    }
});
 
setInterval(function() {
    craftS(scrapAmt);
}, 1000 * 60 * pollCraft)
 
client.on('friendRelationship', function(sid, relationship) {
    if (relationship == SteamUser.EFriendRelationship.RequestRecipient) {
        console.log("We recieved a friend request from "+sid);
        client.addFriend(sid, function (err, name) {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Accepted user with the name of "+name)
        })
    }
 
})
 
client.on('groupRelationship', function(sid, relationship) {
    if (relationship == SteamUser.EClanRelationship.Invited) {
        console.log("We were asked to join steam group #"+sid);
        client.respondToGroupInvite(sid, true);
    }
})
 
client.on('friendsList', function() {
    for (var sid in client.myFriends);
        var relationship = client.myFriends[sid]
        if (relationship == SteamUser.EFriendRelationship.RequestRecipient) {
        console.log("(offline) We recieved a friend request from "+sid);
        client.addFriend(sid, function (err, name) {
            if (err) {
                console.log(err);
                return;
            }
            console.log("(offline) Accepted user with the name of "+name)
        })
    }
})
 
client.on('groupList', function() {
    for (var sid in client.myGroups);
        var relationship = client.myGroups[sid];
        if (relationship == SteamUser.EClanRelationship.Invited) {
        console.log("(offline) We were asked to join steam group #"+sid);
        client.respondToGroupInvite(sid, true);
    }
})