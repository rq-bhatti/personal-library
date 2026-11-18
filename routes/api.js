/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const { MongoClient, ObjectId } = require('mongodb');

const DB_URI = process.env.DB || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fcc-library';
const client = new MongoClient(DB_URI);
const booksPromise = client.connect().then(c => c.db().collection('books'));

function toId(id) {
  try {
    return new ObjectId(id);
  } catch (e) {
    return null;
  }
}

module.exports = function (app) {

  app.route('/api/books')
    .get(async function (req, res, next) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      try {
        const books = await booksPromise;
        const docs = await books.find({}).toArray();
        res.json(docs.map(b => ({
          _id: b._id,
          title: b.title,
          commentcount: (b.comments || []).length
        })));
      } catch (e) { next(e); }
    })

    .post(async function (req, res, next) {
      let title = req.body.title;
      //response will contain new book object including atleast _id and title
      if (!title) return res.send('missing required field title');
      try {
        const books = await booksPromise;
        const doc = { title: String(title), comments: [] };
        const result = await books.insertOne(doc);
        res.json({ _id: result.insertedId, title: doc.title });
      } catch (e) { next(e); }
    })

    .delete(async function (req, res, next) {
      //if successful response will be 'complete delete successful'
      try {
        const books = await booksPromise;
        await books.deleteMany({});
        res.send('complete delete successful');
      } catch (e) { next(e); }
    });



  app.route('/api/books/:id')
    .get(async function (req, res, next) {
      let bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      const _id = toId(bookid);
      if (!_id) return res.send('no book exists');
      try {
        const books = await booksPromise;
        const book = await books.findOne({ _id });
        if (!book) return res.send('no book exists');
        res.json({ _id: book._id, title: book.title, comments: book.comments || [] });
      } catch (e) { next(e); }
    })

    .post(async function (req, res, next) {
      let bookid = req.params.id;
      let comment = req.body.comment;
      //json res format same as .get
      if (!comment) return res.send('missing required field comment');
      const _id = toId(bookid);
      if (!_id) return res.send('no book exists');
      try {
        const books = await booksPromise;
        const book = await books.findOneAndUpdate(
          { _id },
          { $push: { comments: String(comment) } },
          { returnDocument: 'after' }
        );
        if (!book) return res.send('no book exists');
        res.json({ _id: book._id, title: book.title, comments: book.comments || [] });
      } catch (e) { next(e); }
    })

    .delete(async function (req, res, next) {
      let bookid = req.params.id;
      //if successful response will be 'delete successful'
      const _id = toId(bookid);
      if (!_id) return res.send('no book exists');
      try {
        const books = await booksPromise;
        const result = await books.deleteOne({ _id });
        if (result.deletedCount === 0) return res.send('no book exists');
        res.send('delete successful');
      } catch (e) { next(e); }
    });

};
