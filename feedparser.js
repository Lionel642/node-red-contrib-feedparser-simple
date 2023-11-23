
module.exports = function(RED) {
    "use strict";
    var FeedParser = require("feedparser");
    var request = require("request");
    var url = require('url');

    function FeedParseNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        
        this.on("input", function(msg) {
            // check input
            if(msg.payload == null) {
                node.warn(RED._("feedparser-simple.errors.badstatuscode")+" "+res.statusCode);
                return null;
            }
            // do the request
            var req = request(msg.payload, {timeout:10000, pool:false});
            req.setHeader('user-agent', 'Mozilla/5.0 (Node-RED)');
            req.setHeader('accept', 'text/html,application/xhtml+xml');

            var feedparser = new FeedParser();
            // manage request ouput
            req.on('error', function(err) { 
                node.error(err); 
            });
            req.on('response', function(res) {
                if (res.statusCode != 200) { 
                    node.warn(RED._("feedparser-simple.errors.badstatuscode")+" "+res.statusCode); }
                else { 
                    res.pipe(feedparser); 
                }
            });

            // manage feed parsing
            feedparser.on('error', function(error) { 
                node.error(error); 
            });
            feedparser.on('readable', function () {
                var stream = this, article;
                while (article = stream.read()) {
                    // send articles, one article, one message
                    msg.topic = article.origlink || article.link
                    msg.payload = article.description
                    msg.article = article
                                
                    node.send(msg);                    
                }
            });

            feedparser.on('meta', function (meta) {});
            feedparser.on('end', function () {});
        });

    }    

    RED.nodes.registerType("feedparser-simple",FeedParseNode);
}
