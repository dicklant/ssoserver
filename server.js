const express = require('express');
const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa');


const config = {
    auth: {
        clientId: "45390660-c83f-4680-98b6-d87c08d75289", //Le client ID de l'application enregistrée sur Azure Active Directory 
        authority: "https://login.microsoftonline.com/29053aa4-6a7e-4769-a948-245a377b85c9", //Le Tenant ID de votre domaine Azure ACtive Directory
        clientSecret: "Dpc8Q~Sao.jB1Ys60Zo3y-d4GmJTryoNDNMt6cSB",
    }
};

const cca = new msal.ConfidentialClientApplication(config);
const app = express();
 


var port = normalizePort(process.env.PORT || '5000');
app.set('port', port);

const validateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        const validationOptions = {
            audience: config.auth.clientId,
            issuer: config.auth.authority + "/v2.0"
        }

        jwt.verify(token, getSigningKeys, validationOptions, (err, payload) => {
            if (err) {
                console.log(err);
                return res.sendStatus(403);
            }

            next();
        });
    } else {
        res.sendStatus(401);
    }
};


const getSigningKeys = (header, callback) => {
    var client = jwksClient({
        jwksUri: 'https://login.microsoftonline.com/common/discovery/keys'
    });

    client.getSigningKey(header.kid, function (err, key) {
        var signingKey = key.getPublicKey() || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

app.use(express.static('public'));

app.get('/', (req, res) => res.send('Home de SSO Server v0.0.2!'));


app.get('/token', validateJwt, (req, res) => {
    const authHeader = req.headers.authorization;
    const oboRequest = {
        oboAssertion: authHeader.split(' ')[1],
        scopes: [".default"],
    }
    cca.acquireTokenOnBehalfOf(oboRequest).then((response) => {
        console.log(response);
        res.send(response.accessToken);
    }).catch((error) => {
        res.status(401).send(error);
    });

});


// Démarre le serveur
app.listen(port, () => console.log(`Ecoute sur ${port}!`));


function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}