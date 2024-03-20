"use strict";
const express = require('express');
const compression = require('compression');
const options = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['html', 'js', 'scss', 'css'],
    index: false,
    maxAge: '1y',
    redirect: true,
}

const app = express();
app.use(compression());
app.use(express.static("./", options));

app.all('*', function (req, res) {
    res.status(200).sendFile(`/`, {root: "./"});
});

const port = process.env.port || 8082

app.get('/', express.static('./'));

app.listen(port, function () {
    console.log("app is started and listing to the port : ", port);
})