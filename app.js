const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken'); // Cambiado de 'jwtwebtoken' a 'jsonwebtoken'

const app = express();
const port = 3000;

AWS.config.update({ region: 'us-east-1' });
const cognito = new AWS.CognitoIdentityServiceProvider();
const CLIENT_ID = '7phrd90sa0ta78a0d6s66pbvub';

app.use(bodyParser.json());

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization;

    if (token) {
        jwt.verify(token, 'alvaro123', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    const params = {
        ClientId: CLIENT_ID,
        Username: username,
        Password: password,
        UserAttributes: [
            {
                Name: 'email',
                Value: email,
            },
        ],
    };
    try {
        const data = await cognito.signUp(params).promise();
        res.json(data);
    } catch (err) {
        res.status(400).json(err);
    }
});

app.post('/confirm', async (req, res) => {
    const { username, confirmationCode } = req.body;

    const params = {
        ClientId: CLIENT_ID,
        Username: username,
        ConfirmationCode: confirmationCode,
    };

    try {
        const data = await cognito.confirmSignUp(params).promise();
        res.json(data);
    } catch (err) {
        res.status(400).json(err);
    }
});

app.post('/signin', async (req, res) => {
    const { username, password } = req.body;

    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    };

    try {
        const data = await cognito.initiateAuth(params).promise();
        const token = jwt.sign(
            { username: data.AuthenticationResult.AccessToken },
            'alvaro123', 
            { expiresIn: '1h' }
        );
        res.json({ token });
    } catch (err) {
        res.status(400).json(err);
    }
});

app.get('/demoPage', authenticateJWT, (req, res) => {
    res.json({ message: 'Bienvenido al laboratorio 13 Desarrollo y soluciones en la nube' });
});

app.post('/logout', authenticateJWT, async (req, res) => {
    const token = req.headers.authorization;

    const params = {
        AccessToken: token,
    };

    try {
        await cognito.globalSignOut(params).promise();
        res.json({ message: 'Successfully logged out' });
    } catch (err) {
        res.status(400).json(err);
    }
});

app.use((req, res) => {
    res.status(404).json({ message: 'Page not found' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
