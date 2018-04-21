const express = require("express");
const passport = require("passport");
const chunk = require("chunk");
const Util = require("../Util");
const { r } = require("../ConstantStore");
const app = module.exports = express.Router();

app.get("/", async (req, res) => {
    const bots = await Promise.all((await r.table("bots").filter({verified: true}).sample(4 * 2).run()).map(bot => Util.attachPropBot(bot, req.user)));
    const botChunks = chunk(bots, 4); // 4 bots per 
    console.log(bots);
    res.render("index", {user: req.user, rawBots: bots, botChunks});
});

app.get("/bot/:id", async (req, res, next) => {
    const rB = await r.table("bots").get(req.params.id).run();
    if (!rB) return next();
    const bot = await Util.attachPropBot(rB, req.user);
    if (!bot.verified && !((req.user ? (req.user.mod || req.user.admin) : false) || req.user.id == rB.ownerID)) return res.sendStatus(404); // pretend it doesnt exist lol
    res.render("botPage", {user: req.user, bot});
});

app.get("/bot/:id/key", async (req, res, next) => {
    const rB = await r.table("bots").get(req.params.id).run();
    if (!rB) return next();
    const bot = await Util.attachPropBot(rB, req.user);
    if (bot.verified) {
        if (req.user) {
            if (req.user.id !== bot.ownerID) res.sendStatus(403)
            else return res.render("botKey", {bot: rB});
        } else return res.sendStatus(401);
    } else return res.sendStatus(403);
})

app.get("/user/:id", async (req, res, next) => {
    res.status(501).send("User profiles coming soon!");
    return;
    let user = await r.table("users").get(req.params.id).run();
    if (!user) return next();
    user = await Util.attachPropUser(user);
    res.render("userPage", {user: req.user, profile: user});
});

// debugging -- currently commented out due to security issues.
// app.get("/debug", async (req, res, next) => {
//     if (!req.user) return next();
//     if (req.user.id !== "142244934139904000" || req.user.id !== "250536623270264833") return next();
//     res.render("admin_debug", {user: req.user});
// });

// app.post("/debug", async (req, res, next) => {
//     if (!req.user) {
//         return next();
//     }
//     if (req.user.id !== "142244934139904000" || req.user.id !== "250536623270264833") {
//         return next();
//     }
//     if (typeof req.body.code !== "string") return res.status(400).json({error: "ron i expected a body that looks like this: {"code":"memes"} "});
//     try {
//         const js = req.body.code;
//         let result = eval(js);
//         if (result.then) {
//             result = await result;
//         }
//         if (typeof result !== "string") JSON.stringify(result);
//         res.status(200).json({ok: result});
//     } catch (error) {
//         res.status(500).json({error: error.toString()});
//     }
// });