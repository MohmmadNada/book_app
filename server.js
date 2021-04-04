'use strict';
// Prepare the server

require('dotenv').config();
const express = require('express');
// const { Console } = require('node:console');
const superagent = require('superagent');
const app = express();
app.set('view engine', 'ejs');
const PORT = process.env.PORT;
app.use(express.static('./public/'));
app.use(express.urlencoded({ extended: true }))
    // app.use(express.static('public/styles/'));

app.get('/test', (req, res) => {
    res.render('pages/index')
})
app.get('/', (req, res) => {
    res.render('pages/index')
})
let bookArr = [];

function Book(t, a, d, src, isbn) {
    this.title = t || 'No title available';
    this.author = a || 'no author available';
    this.des = d || 'no description available';
    this.img = src || 'https://i.imgur.com/J5LVHEL.jpg';
    this.type = isbn || 'No isbn available';
    bookArr.push(this)
}
app.get('/searches/new', (req, res) => {
    res.render('pages/searches/new')
})
app.post('/searches', (req, res) => {

    let info = req.body.one;
    let url = `https://www.googleapis.com/books/v1/volumes?q=${info[0]}+${info[1]}`;
    superagent.get(url).then(result => {
        let books = result.body.items;


        books.forEach(element => {

            let reg = /https/gi;
            let title = element.volumeInfo.title;
            let author = ''
            if (element.volumeInfo.authors) {
                author = element.volumeInfo.authors.join(' and ');
            } else {
                author = 'no author available'
            }
            let des = element.volumeInfo.description;
            let str = element.volumeInfo.imageLinks.smallThumbnail;
            let type2 = element.volumeInfo.industryIdentifiers;
            let type = '';
            if (type2) {
                type = type2[0].type
            } else {
                type = 'OTHER'
            }
            if (reg.test(str)) {

                let newBook = new Book(title, author, des, str, type);
            } else {

                let str2 = str.replace('http://', 'https://')
                let newBook = new Book(title, author, des, str2, type);


            }
        });


        res.render('pages/searches/show', { myBooks: bookArr })
    })
})
app.use('*', notFoundHandler); // 404 not found url

app.use(errorHandler);

function notFoundHandler(request, response) {
    response.status(404).sendFile('./error', { root: './pages' })
}

function errorHandler(err, request, response, next) {
    response.status(500).render('pages/error');
}
// book image author title isbn description
app.listen(PORT, () => console.log(`I'm using ${PORT} port`))