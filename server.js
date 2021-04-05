'use strict';
require('dotenv').config(); //for env 
const express = require('express');
const superagent = require('superagent');
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL)
app.set('view engine', 'ejs');
const PORT = process.env.PORT;
app.use(express.static('./public/'));
app.use(express.urlencoded({ extended: true }))
    // app.use(express.static('public/styles/'));

// app.get('/test', (req, res) => {
//     res.render('pages/index')
// })
app.get('/', (req, res) => {
    let SQL = 'SELECT * FROM books';
    client.query(SQL).then(response => {
        let result = response.rows;
        let count = result.length;
        res.render('pages/index', { myBooks: result, num: count })
    })
})
app.get('/books/details/:id', (req, res) => {
    let SQL = 'SELECT * FROM books WHERE id=$1';
    let ids = req.params.id;
    client.query(SQL, [ids]).then(response => {
        let result = response.rows[0];
        // console.log(result)
        res.render('pages/searches/detail', { myBooks: result })
    })

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

        if (result.body.totalItems) {
            books.forEach(element => {

                let reg = /https/gi;
                let title = element.volumeInfo.title;
                let author = ''
                if (element.volumeInfo.authors) {
                    author = element.volumeInfo.authors.join(' + ');
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
        } else {
            new Book()
        }


        res.render('pages/searches/show', { myBooks: bookArr })
    })
})
app.post('/', (req, res) => {
    let info = req.body.two;

    let values = [info[2], info[1], info[4], info[0], info[3]];
    let SQL = 'INSERT INTO books (author, title, isbn, image_url, description) VALUES ( $1, $2, $3, $4, $5) RETURNING *';

    client.query(SQL, values).then((y) => {
        console.log(y.rows)
        let n = y.rows[0].id;
        res.redirect(`/books/details/${n}`)
    }).catch(err => {
        console.log(err)
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
client.connect().then(() => {

    app.listen(PORT, () => console.log(`I'm using ${PORT} port`))
})