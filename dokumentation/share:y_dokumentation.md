# Share:y dokumentation

Sociala medie applikationen som jag har skapat heter "Share:y".

### Funktioner

- Skapa konto
- Cookie-baserad inloggning
- Skapa inlägg
- Visa inlägg på hemskärmen av sidan
- Visa inlägg i profiler
- Ändra dina tidigare inlägg
- Radera dina tidigare inlägg
- Simpel och effektiv design

### Kod

Du kan hitta Share:y's källkod på min [Github](https://github.com/SkrodS/Share.y). Share:y är skrivet med NodeJS, EJS och databasen är gjord i MongoDB.

# Utveckling av Share:y

### Planering

När jag startade projektet visste jag att en fungerande CRUD-struktur var nödvändig för att nå Niklas krav. 
Jag hade en bild av hur designen av sidan skulle se ut, simpel startsida med en bild, standard inloggnings- och registreringssida och en effektiv första sida som syns när man loggat in. 
När jag planerade önskade jag, uttöver CRUD, att kunna implementera cookies för inloggning och att implementera stöd för uppladdning av bilder till Share:y. 
Hindren jag såg var att beroende på hur lång tid allting skulle komma att ta så var jag villig att prioritera cookies framför bilder i och med att det handlar om säkerhet för användare medan bilder endast är en "cool" effekt.

### Wireframe

Här är wireframe:en jag gjorde för att befästa min vision av hur startsidan skulle se ut:
>![image](https://i.imgur.com/IbaCNk5.png)

### Prototyp

Eftersom veckorna innan jag började utveckla Share:y hade bestått av att göra prototyper av CRUD valde jag att utgå från mina tidigare CRUD-försök när jag skulle göra prototyper för Share:y. Dessa prototyper använde MongoDB, NodeJS och EJS, så det blev vad jag valde att använda för att skapa Share:y. Prototyperna var mycket enkla och kunde se ut på följande sätt:
>![image](https://i.imgur.com/w5q7VNJ.png)

Sidan som visas ovan är ett form som skapar en användare efter följande schema:
```javascript
const UsrSchema = new moon.Schema({
    usr: String,
    pass: String,
    fName: String,
    eName: String,
    age: Number,
    inS: Boolean,
});
```

Efter dem första protoyperna började jag experimentera med cookies och misslyckades tyvärr med att skapa en generell funktion som åstadkom vad jag ville. Slutligen valde jag att ha en anpassad cookie-autentiseringen i varje get route där den var nödvändig. Ett exmepel på detta är i min inloggningsskärm där man blir flyttad till show-sidan om man har redan har giltiga cookies:
```javascript
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
```

### Förfining av UI/Design

Vid denna tidpunkt kände jag för att utmana mig och skapa något som faktiskt var användarvänligt och såg bra ut. Hadi introducerade mig till ett klassbibliotek för HTML som heter [Bulma](https://bulma.io). Bulma visade sig vara såpass advancerat att det skulle bil en överkomlig utmaning att jobba med medan det samtidigt erbjöd en mycket snygg hemsida. Bulma i kombination med EJS gjorde det möjligt att skapa användarvänlighet i form av både ögonbehag och funktionalitet till exempel genom fel- och successmeddelanden vid inloggning och registrering. För att illustrera vad jag menar så kommer här några bilder på designen:
>![image](https://i.imgur.com/cLGlQfd.png)
>![image](https://i.imgur.com/0LWimHd.png)
>![iamge](https://i.imgur.com/3X1sa5B.png)

### Tweaks

En tweak jag vale att implementera var att skapa särskilda show-sidor för varje enskild användare. Dessa genereras såklart on-demand. Dessa sidor innehar olika knappar beroende på om man som användare är inne på sin egen profil eller om man är inne på en annan användares profil. Knapparna som dyker upp för den egna användarens profil är till för att kunna redigera inlägg och radera inlägg. Så här ser kan det se ut om man går in på sin egna profil:
>![image](https://i.imgur.com/0mexGnr.png)

### Lansering

Detta är tillfället då jag laddar upp koden och min dokumentation på [Github](https://github.com/SkrodS/Share.y).
