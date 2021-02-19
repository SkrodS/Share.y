const exp = require("express");
const app = exp();
// const bp = require("body-parser");
const mon = require("mongoose");
const mo = require("method-override");
const md5 = require("md5");
const Cookies = require("cookies");
const cookieParser = require("cookie-parser");



app.set("view engine", "ejs");
app.use(exp.urlencoded({ extended: true }));
app.use(exp.static(__dirname + "resources"));
app.use(mo("_method"));
app.use(cookieParser());

mon.connect("mongodb://localhost:27017/social-media-project", { useNewUrlParser: true, useUnifiedTopology: true });

//Mall för användare
const UsrSchema = new mon.Schema({
    email: String,
    fullName: String,
    user: String,
    password: String,
    sessionId: String,
});

//Mall för posts
const PostSchema = new mon.Schema({
    author: String,
    authorId: String,
    title: String,
    content: String,
    date: Date,
});

//Skapar collections i databasen
let User = mon.model("User", UsrSchema);
let Post = mon.model("Post", PostSchema);

//Gör så att man automatiskt hamnar på /index om man ansluter till /
app.get("/", (req, res) => {
    res.redirect("/index");
});

//Kollar clientens kakor och om den innehåller giltiga kakor blir man skickad till /index/show och om man inte har giltiga kakor renderas index.ejs
app.get("/index", (req, res) => {
    const {cookies} = req;

    if ("sessionId" in cookies && "userId" in cookies) {
        User.findById(cookies.userId, (err, user) => {
            if (err) {
                console.log(err);
                res.render("index");
            };
            if (user) {
                if (cookies.sessionId === user.sessionId) {
                    res.redirect("/index/show");
                }
                else {
                    res.render("index");
                };
            }
            else {
                res.render("index");
            };
        });
    }
    else {
        console.log("inga cookies");
        res.render("index");
    };
});

//CREATE ROUTE //Renderar create.ejs som är singup-sidan. 
//Tar även med sig errorCreate som innehåller ett särskilt värde för varje error som kan uppstå när man fyller i formen.
let errorCreate = 0;
let created = false;
app.get("/index/signup", (req, res) => {
    res.render("create", {error:errorCreate});
    errorCreate = 0;
});

//Kollar först att alla fält är korrekt ifyllda och om användarnamnet och e-posadressen är unika. 
//Om allt är korrekt skapas en användare om man blir flyttad till signin-sidan med ett success-meddelande.
app.post("/index/signup", (req, res) => {
    let email = req.body.email;
    let fullname = req.body.fullname;
    let user = req.body.user;
    let password = md5(req.body.password);
    let testPassword = md5(req.body.testPassword);

    if (email.length > 0 && fullname.length > 0 && user.length > 0 && req.body.password.length > 5 && testPassword === password) {
        User.count({user:user}, (err, data) => {
            if (err) {
                res.redirect("/index/signup");
                console.log(err);
                return;
            };

            if (data > 0) {
                errorCreate = 6;
                res.redirect("/index/signup");
                console.log("The user you entered isn't unique.");
                return;
            };
            
            User.count({email:email}, (err, data) =>{
                if (err) {
                    res.redirect("/index/signup");
                    console.log(err);
                    return;
                };

                if (data > 0) {
                    errorCreate = 7;
                    res.redirect("/index/signup");
                    console.log("The Email you entered isn't unique.");
                    return;
                };

                User.create({
                    email: email,
                    fullName: fullname,
                    user: user,
                    password: password,
                    sessionId: null,
                });
                created = true;
                res.redirect("/index/signin");
            });
        });
    }
    else if (email.length <= 0) {
        errorCreate = 1;
        res.redirect("/index/signup");
        console.log(errorCreate);
        console.log("email.length");
    }
    else if (fullname.length <= 0) {
        errorCreate = 2;
        res.redirect("/index/signup");
        console.log("fullname.length");
    }
    else if (user.length <= 0) {
        res.redirect("/index/signup");
        console.log("user.length");
        errorCreate = 3;
    }
    else if (req.body.password.length <= 5) {
        errorCreate = 4;
        res.redirect("/index/signup");
        console.log("password.length");
    }
    else if (testPassword != password) {
        errorCreate = 5;
        res.redirect("/index/signup");
        console.log("testPassword");
    }
    else {
        res.redirect("/index");
    }
});

//SIGN IN. Kollar om kakor giltiga kakor finns i clienten och om det gör det så blir man flyttad till /index som sen tar en vidare till /index/show eftersom giltiga kakor finns.
//Om inte giltiga kakor finns så renderas signin med variablerna som innehåller felmeddelande och success-meddelande.
let errorSignIn = false;
app.get("/index/signin", (req, res) => {
    const {cookies} = req;

    if ("sessionId" in cookies && "userId" in cookies) {
        User.findById(cookies.userId, (err, user) => {
            if (err) {
                console.log(err);
                res.render("signin", {error:errorSignIn, created:created});
                created = false;
                errorSignIn = false;            
            };
            if (user) {
                if (cookies.sessionId === user.sessionId) {
                    res.redirect("/index");
                    created = false;
                    errorSignIn = false;
                }
                else {
                    res.render("signin", {error:errorSignIn, created:created});
                    created = false;
                    errorSignIn = false;                
                };
            }
            else {
                res.render("signin", {error:errorSignIn, created:created});
                created = false;
                errorSignIn = false;            
            };
        });
    }
    else {
        console.log("inga cookies");
        res.render("signin", {error:errorSignIn, created:created});
        created = false;
        errorSignIn = false;    
    };
});

//Kollar om det som är skrivet i inloggningsfälten stämmer överens med en användare i databasen och om det gör det blir användaren tilldelad giltiga kakor 
//Om det inte stämmer överens blir man skickad till /index/signin med felmeddelande. Kakorna är giltiga i en dag.
app.post("/index/signin", (req, res) => {
    let user = req.body.user;
    let password = md5(req.body.password);

    User.findOne({user:user}, async (err, currentUser) => {
        if (err) {
            console.log(err);
            return
        }
        if (currentUser) {
            if (user === currentUser.user && password === currentUser.password) {

                let date = new Date();
                let expDate = new Date(date.getMilliseconds() + 86400000);

                let sessionId = md5(Math.random(Date.prototype.getMilliseconds));


                res.cookie("sessionId", sessionId, {maxAge: expDate});
                res.cookie("userId", currentUser._id, {maxAge: expDate});


                await User.findByIdAndUpdate(currentUser._id, {sessionId:sessionId });

                res.redirect("/index");
            }
            else {
                errorSignIn = true;
                res.redirect("/index/signin");
            };
        }
        else {
            errorSignIn = true;
            res.redirect("/index/signin");
        };
    });
});

//SHOW MAIN PAGE ROUTE. Letar efter giltiga kakor och om det finns så renderas show.ejs annars blir man skickad till /index.
//Show.ejs renderas med tre variabler, user som innehåller den inloggades användare, error som innehåller potentiella felmeddelanden vid uppladdning av posts
//och data som innehåller alla tidigare posts i databasen.
let errorPost = false;
app.get("/index/show", (req, res) => {
    const {cookies} = req;

    if ("sessionId" in cookies && "userId" in cookies) {
        User.findById(cookies.userId, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/index");
            };
            if (user) {
                if (cookies.sessionId === user.sessionId) {
                    Post.find({}, (err, data) => {
                        if (err) {
                            res.redirect("/index");
                        }
                        else {
                            res.render("show", {user:user, error:errorPost, data:data});
                            errorPost = false;
                        };
                    })
                }
                else {
                    res.redirect("/index");
                };
            }
            else {
                res.redirect("/index");
            };
        });
    }
    else {
        console.log("inga cookies");
        res.redirect("/index");
    };
});

//SHOW PROFILE ROUTE. Kollar om giltiga kakor finns, om det inte finns blir man flyttad till /index. Om det finns giltiga kakor renderas profile med tre stycken variabler.
//Variablarna är följande: profile som innehåller användaren som profilen tillhör, user som innehåller användaren som läser in profilen och posts som innehåller alla posts profilägaren har gjort.
//Alla variablar hanteras vidare av EJS filen så att profilen visas korrekt. Variabeln user gör även att ejs dokumentet visar olika saker beroende på om user.user är samma som profile.user.
app.get("/index/:id", (req, res) => {
    const {cookies} = req;

    if ("sessionId" in cookies && "userId" in cookies) {
        User.findById(cookies.userId, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/index");
            };
            if (user) {
                if (cookies.sessionId === user.sessionId) {
                    Post.find({}, (err, data) => {
                        if (err) {
                            res.redirect("/index");
                        }
                        else {
                            User.findById(req.params.id, (err, profile) => {
                                User.findById(cookies.userId, (err, user) => {
                                    Post.find({authorId: profile._id}, (err, posts) => {
                                        res.render('profile', { profile: profile, user: user, posts: posts})
                                    });
                                });
                            });
                        };
                    })
                }
                else {
                    res.redirect("/index");
                };
            }
            else {
                res.redirect("/index");
            };
        });
    }
    else {
        console.log("inga cookies");
        res.redirect("/index");
    };
});

//POST ROUTE. Skapar en post. Om något av fälten är tomma så blir man skickad till /index (som för en vidare till /index/show om man har giltiga kakor) 
//med felmeddelande som hanteras av ejs-filen.
app.post("/index/post", (req, res) => {
    const {cookies} = req;
    let title = req.body.title;
    let content = req.body.content;

    User.findById(cookies.userId, (err, user) => {
        if (title.length > 0 && content.length > 0) {
            Post.create({
                author: user.user,
                authorId: cookies.userId,
                title: title,
                content: content,
                date: Date(),
            });
            res.redirect("/index");
        }
        else {
            errorPost = true;
            res.redirect("/index");
        };
    });
});

//DELETE A POST. Kollar om man har giltiga kakor och om user.user är samma som post.author och om det stämmer så kommer man till en sida som frågar
//om man verkligen vill radera inlägget. Om man klickar ja så skickas app.delete("/index/:id");.
app.get("/index/:id/delete", (req, res) => {
    const {cookies} = req;
    if ("sessionId" in cookies && "userId" in cookies) {
        User.findById(cookies.userId, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/index");
            };
            if (user) {
                if (cookies.sessionId === user.sessionId) {
                    Post.find({}, (err, data) => {
                        if (err) {
                            res.redirect("/index");
                        }
                        else {
                            Post.findById(req.params.id, (err, post) => {
                                User.findById(cookies.userId, (err, user) => {
                                    if (post) {
                                        if (user.user == post.author) {
                                            res.render("delete", {post:post});
                                        }
                                        else {
                                            res.redirect("/index");
                                        };  
                                    }
                                    else {
                                        res.redirect("/index");
                                    }
                                });
                            });
                        };
                    })
                }
                else {
                    res.redirect("/index");
                };
            }
            else {
                res.redirect("/index");
            };
        });
    }
    else {
        console.log("inga cookies");
        res.redirect("/index");
    };
});

//Raderar inlägget som skickades med från /index/:id/delete och skickar användaren tillbaka till profilen som inlägget fanns på .
app.delete("/index/:id", (req, res) => {
    Post.findByIdAndDelete(req.params.id, (err, post) => {
        let profile = "/index/" + post.authorId;
        res.redirect(profile);
    });
});


//EDIT ROUTE. Kollar om giltiga kakor finns och om user.user är samma som post.author och om det stämmer så visas edit.ejs där man får ändra på inlägget.
//Om kakor inte finns och user.user inte är samma som post.author så blir man skickad till /index.
app.get("/index/:id/edit", (req, res) => {
    const {cookies} = req;
    if ("sessionId" in cookies && "userId" in cookies) {
        User.findById(cookies.userId, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/index");
            };
            if (user) {
                if (cookies.sessionId === user.sessionId) {
                    Post.find({}, (err, data) => {
                        if (err) {
                            res.redirect("/index");
                        }
                        else {
                            Post.findById(req.params.id, (err, post) => {
                                User.findById(cookies.userId, (err, user) => {
                                    if (user.user == post.author) {
                                        res.render("edit", {post:post})
                                    }
                                    else {
                                        res.redirect("/index");
                                    };
                                });
                            });
                        };
                    })
                }
                else {
                    res.redirect("/index");
                };
            }
            else {
                res.redirect("/index");
            };
        });
    }
    else {
        console.log("inga cookies");
        res.redirect("/index");
    };
});

//EDIT A POST. Ändrar posten som skickades med från /index/:id/edit och skickar tillbaka användaren till profilen.
app.put("/index/:id", async (req, res) => {
    let title = req.body.title;
    let content = req.body.content;

    await Post.findByIdAndUpdate(req.params.id, {
        title: title,
        content: content,
        date: Date.now(),
    });
    Post.findById(req.params.id, (err, post) => {
        let profile = "/index/" + post.authorId;
        res.redirect(profile);
    });
});

//LOGOUT. Ändrar användarens sessionId i databsen till null så att det inte matchar med kakorna och sen blir användaren skickad till /index.
app.put("/logout", async (req, res) => {
    const {cookies} = req;
    await User.findByIdAndUpdate(cookies.userId, {sessionId:null});
    res.redirect("/index");
});

//localhost:3000
app.listen(3000, (err) => {
    if (err) {
        console.log(err);
        console.log("någonting blev fel");
    }
    else {
        console.log("Connected");
    }
});