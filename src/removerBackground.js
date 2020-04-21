const fs = require('fs');
const request = require('request');
const cfg = require('../config.json');

exports.removerBackground = function (link_URL, message) {
    request.post({
        url: 'https://api.remove.bg/v1.0/removebg',
        formData: {
            image_url: link_URL,
            size: 'auto',
        },
        headers: {
            'X-Api-Key': cfg.tokenRemBg
        },
        encoding: null
    }, function (error, response, body) {
        if (error) return console.error('Request remove background failed:', error);
        if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        fs.writeFileSync("./no-bg.png", body);
        message.channel.send(`Aqui está:`, {
            files: [
                "./no-bg.png"
            ]
        });
    });
} 