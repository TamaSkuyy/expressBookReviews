const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

function compareTwoStrings(str1, str2) {
  let longer = str1;
  let shorter = str2;
  if (str1.length < str2.length) {
      longer = str2;
      shorter = str1;
  }
  let longerLength = longer.length;
  if (longerLength === 0) {
      return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(str1, str2) {
  let costs = [];
  for (let i = 0; i <= str1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= str2.length; j++) {
          if (i === 0) {
              costs[j] = j;
          } else {
              if (j > 0) {
                  let newValue = costs[j - 1];
                  if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
                      newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                  }
                  costs[j - 1] = lastValue;
                  lastValue = newValue;
              }
          }
      }
      if (i > 0) {
          costs[str2.length] = lastValue;
      }
  }
  return costs[str2.length];
}

const doesExist = (username)=>{
  let userswithsamename = users.filter((user)=>{
    return user.username === username
  });
  if(userswithsamename.length > 0){
    return true;
  } else {
    return false;
  }
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

public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  let result = isValid(username);
  if (!result.valid) {
      console.error(result.message);
  }

  if (username && password) {
    if (!doesExist(username)) { 
      users.push({"username":username,"password":password});
      return res.status(200).json({message: "User successfully registered. Now you can login"});
    } else {
      return res.status(404).json({message: "User already exists!"});    
    }
  } 
  return res.status(404).json({message: "Unable to register user."});
});

// Get the book list available in the shop
public_users.get('/',async function (req, res) {
  new Promise((resolve, reject) => {
      resolve(JSON.stringify(books,null,4));
  }).then((result) => {
      res.send(result);
  }).catch((err) => {
      console.log(err);
  });
});


// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  let isbn = req.params.isbn;
  let bookKeys = Object.keys(books);
  let promiseArray = [];
  for (let i = 0; i < bookKeys.length; i++) {
    let similarityPromise = new Promise((resolve, reject) => {
      let similarity = compareTwoStrings(books[bookKeys[i]].isbn.toLowerCase(), isbn.toLowerCase());
      if (similarity > 0.8) {
        resolve(books[bookKeys[i]]);
      } else {
        reject();
      }
    });
    promiseArray.push(similarityPromise);
  }
  
  Promise.allSettled(promiseArray)
  .then((values) => {
    let fulfilledValues = values.filter(value => value.status === 'fulfilled').map(value => value.value);
    res.send(fulfilledValues);
  })
  .catch((error) => {
    console.log(error);
    res.status(500).send({ error: 'An error occurred' });
  });

 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  let author = req.params.author;
  let bookKeys = Object.keys(books);
  let promiseArray = [];
  for (let i = 0; i < bookKeys.length; i++) {
    let similarityPromise = new Promise((resolve, reject) => {
      let similarity = compareTwoStrings(books[bookKeys[i]].author.toLowerCase(), author.toLowerCase());
      if (similarity > 0.8) {
        resolve(books[bookKeys[i]]);
      } else {
        reject();
      }
    });
    promiseArray.push(similarityPromise);
  }
  
  Promise.allSettled(promiseArray)
  .then((values) => {
    let fulfilledValues = values.filter(value => value.status === 'fulfilled').map(value => value.value);
    res.send(fulfilledValues);
  })
  .catch((error) => {
    console.log(error);
    res.status(500).send({ error: 'An error occurred' });
  });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  let title = req.params.title;
  let bookKeys = Object.keys(books);
  let promiseArray = [];
  for (let i = 0; i < bookKeys.length; i++) {
    let similarityPromise = new Promise((resolve, reject) => {
      let similarity = compareTwoStrings(books[bookKeys[i]].title.toLowerCase(), title.toLowerCase());
      if (similarity > 0.8) {
        resolve(books[bookKeys[i]]);
      } else {
        reject();
      }
    });
    promiseArray.push(similarityPromise);
  }
  
  Promise.allSettled(promiseArray)
  .then((values) => {
    let fulfilledValues = values.filter(value => value.status === 'fulfilled').map(value => value.value);
    res.send(fulfilledValues);
  })
  .catch((error) => {
    console.log(error);
    res.status(500).send({ error: 'An error occurred' });
  });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  let isbn = req.params.isbn;
  let bookKeys = Object.keys(books);
  let result = [];
  for (let i = 0; i < bookKeys.length; i++) {
      let similarity = compareTwoStrings(books[bookKeys[i]].isbn.toLowerCase(), isbn.toLowerCase());
      if (similarity > 0.3) {
          result.push(books[bookKeys[i]].reviews);
      }
  }
  res.send(result);
});

module.exports.general = public_users;
