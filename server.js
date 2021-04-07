'use strict';
// Prepare the server

require('dotenv').config();
const express = require('express');
// const { Console } = require('node:console');
const superagent = require('superagent');
const pg = require('pg');
const methodoverride = require('method-override');
const app = express();
const client = new pg.Client(process.env.DATABASE_URL)
app.set('view engine', 'ejs');
const PORT = process.env.PORT;
app.use(express.static('./public/'));
app.use(express.urlencoded({ extended: true }))
app.use(methodoverride('_method'));


app.get('/test', (req, res) => {
    res.render('pages/index')
})
app.get('/', (req, res) => {
    let SQL = 'select books.*,authors.name from books,authors where books.author_id=authors.id;';
    client.query(SQL).then(response => {
        let result = response.rows;
        let count = result.length;
        // console.log(result);
        res.render('pages/index', { myBooks: result, num: count })
    })
})
app.get('/books/details/:id', (req, res) => {
    let ids = req.params.id;
    let SQL = 'SELECT * FROM books join authors on books.author_id = authors.id WHERE books.id=$1';
    client.query(SQL, [ids]).then(response => {
        let result = response.rows[0];
        console.log('------------------------------');

        // console.log(response);
        console.log('------------------------------');
        // console.log(response.rows);
        console.log('------------------------------');
        console.log(result)
        res.render('pages/searches/detail', { myBooks: result })
    })

})
app.put('/books/details/:id', (req, res) => {
    // let id = req.params.id;
    let SQL = 'UPDATE books SET title=$1, description=$2, image_url=$3, isbn=$4 WHERE id=$5';
    const { title, description, author, isbn, img, author_id, id } = req.body;
    // console.log(title,'---------', description, author, isbn, '-------------',img)
    let values = [title, description, img, isbn, id];
    client.query(SQL, values).then(result => {
        let newSQL = `UPDATE authors set name=$1 WHERE  authors.id = $2 `;
        client.query(newSQL, [author, author_id]).then(results => {
            console.log(results);
            console.log('___________________________', id);
            res.redirect(`/`);
        })
    })
})
app.delete('/books/details/:id', (req, res) => {
    let id = req.params.id;
    let SQL = 'DELETE FROM books WHERE id=$1';
    client.query(SQL, [id]).then(result => {
        // console.log(result);
        res.redirect('/');
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

    // let values = [info[2],info[1],info[4],info[0],info[3]];
    let SQL = 'SELECT * FROM authors where name = $1'
        // let SQL = 'INSERT INTO books (author, title, isbn, image_url, description) VALUES ( $1, $2, $3, $4, $5) RETURNING *';

    client.query(SQL, [info[2]]).then((y) => {
        console.log(y.rows)
        if (y.rowCount) {
            let b = y.rows[0].id;
            let newSQL = 'INSERT INTO books ( title, isbn, image_url, description, author_id) VALUES ( $1, $2, $3, $4, $5) RETURNING *';
            client.query(newSQL, [info[1], info[4], info[0], info[3], b]).then((x) => {

            })
        } else {
            let newSQL = `INSERT INTO authors (name) VALUES($1);`
            client.query(newSQL, [info[2]]).then((m) => {
                let sqlNew = `INSERT INTO books ( title, isbn, image_url, description, author_id) VALUES ( $1, $2, $3, $4, (SELECT id FROM authors ORDER BY id DESC LIMIT 1));`;
                client.query(sqlNew, [info[1], info[4], info[0], info[3]]).then(() => console.log('nothing'))
            })
        }
        res.redirect(`/`)
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