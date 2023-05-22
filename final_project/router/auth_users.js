const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  // Check if the username is a string
  if (typeof username !== 'string') {
      return { valid: false, message: 'Username must be a string' };
  }

  // Check if the username is between 3 and 20 characters long
  if (username.length < 3 || username.length > 20) {
      return { valid: false, message: 'Username must be between 3 and 20 characters long' };
  }

  // Check if the username only contains letters, numbers, and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }

  // If all checks pass, the username is valid
  return { valid: true };
}

const authenticatedUser = (username,password)=>{ //returns boolean
  let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password)
  });
  if(validusers.length > 0){
    return true;
  } else {
    return false;
  }
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
      return res.status(404).json({message: "Error logging in"});
  }

  if (authenticatedUser(username,password)) {
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = {
        accessToken,username
    }
    return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  try {
    // get user input
    const isbn = req.params.isbn;
    const review = req.body.review;

    // check if books object is defined
    if (!books) {
      console.log('books object is undefined');
      return res.status(500).json({ message: 'Internal server error' });
    }

    // check if book exists in database
    const book = Object.values(books).find(book => book.isbn === isbn);
    if (!book) {
      console.log(`book not found for isbn: ${isbn}`);
      return res.status(404).json({ message: 'Book not found' });
    }

    // add review to book
    book.reviews.push(review);
    // book.save();

    // return updated book
    res.json(book);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  try {
    // get user input
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    // check if books object is defined
    if (!books) {
      console.log('books object is undefined');
      return res.status(500).json({ message: 'Internal server error' });
    }

    // check if book exists in database
    const book = Object.values(books).find(book => book.isbn === isbn);
    if (!book) {
      console.log(`book not found for isbn: ${isbn}`);
      return res.status(404).json({ message: 'Book not found' });
    }

    // filter out reviews by current user
    book.reviews = book.reviews.filter(review => review.username !== username);

    // return updated book
    res.json(book);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
