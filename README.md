<h1>Auction Site API</h1>

## Background

-------

This API was an assignment I had during my third year of university. It makes up the backend half of a Auction site. 
This was the first API I had ever written so it was not the most elegant execution. I also had very limited experience with javascript and this was my first project in typescript.


### Key Learnings

 - Understanding of API specifications and design.
 - Learnings in javascript/typescript syntax.
 - Introduction to postman testing,
 - I also learnt a lot about architecture and design of API, notably with middleware.


-----

## Original Readme 

<h3>Running the API</h2>

<h4>Step 1: Installing required node packages  </h3>
`npm install`

<h4>Step 2: Create a .env file for database access</h3>
Make a .env file in the projects root directory (scl113) and add the following segment, putting your uc credentials in the required fields:

```
MYSQL_HOST={MySQL database server}
MYSQL_DATABASE={MySQL database name}
MYSQL_USER={MySQL Username}
MYSQL_PASSWORD={MySQL Password} 
MYSQL_PORT={MySQL server port (defaults to 3306)}
PORT=4000 <br>
```

<h4>Step 3: Running the app </h3>
From the scl113 directory, call "npm run start"