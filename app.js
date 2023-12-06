require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// configuração para erro de cors
app.use(cors());

// configuração para a aplicação entender json
app.use(express.json());

// Models
const User = require('./models/User');

app.get('/', (req, res) => {
    res.status(200).json({ msg: 'Bem vindo a nossa API!' })
});

// registrar usuario no sistema:
app.post('/auth/register', async (req, res) => {

    const { name, email, password, confirmpassword } = req.body;

    // validações
    if (!name) {
        return res.status(422).json({ msg: 'O nome é obrigatório!' });
    }

    if (!email) {
        return res.status(422).json({ msg: 'O e-mail é obrigatório!' });
    }

    if (!password) {
        return res.status(422).json({ msg: 'A senha é obrigatório!' });
    }

    if (password !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem!' });
    }

    // verificar se o usuário existe
    const userExists = await User.findOne({ email: email });

    if (userExists) {
        return res.status(422).json({ msg: 'Por favor utilize outro e-mail!' });
    }

    // create user
    const user = new User({name, email, password});

    try {

        await user.save();

        res.status(201).json({ msg: 'Usuário criado com sucesso!' });

    } catch(error) {
        console.log('Erro: ', error);

        res.status(500).json({ msg: 'Aconteceu um erro no servidor, tente novamente mais tarde!' });
    }
});

// Logar no sistema
app.post('/auth/login', async (req, res) => {

    const { email, password } = req.body;

    // validações:
    if (!email) {
        return res.status(422).json({ msg: 'O e-mail é obrigatório!' });
    }

    if (!password) {
        return res.status(422).json({ msg: 'A senha é obrigatório!' });
    }

    // verificar se o usuário existe
    const user = await User.findOne({ email: email });
    
    if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado!' });
    }

    if (password != user.password) {
        return res.status(404).json({ msg: 'Senha inválida!' });
    }

    try {

        const secret = process.env.SECRET;
        
        const token = jwt.sign(
            {
                id: user._id
            }
            , secret
        );

        res.status(200).json(
            { 
                msg: 'Logado com sucesso!', 
                token: token 
            }
        );

    } catch (err) {
        console.log('Erro: ', error);

        res.status(500).json({ msg: 'Aconteceu um erro no servidor, tente novamente mais tarde!' });
    }

});

// rota privada -> Só funciona com o token:
app.get('/user/:id', checkToken, async (req, res) => {

    const { id } = req.params;

    // verificar se o usuário existe:
    const user = await User.findById(id, '-password');

    if (!user) {
        return res.status(404).json({msg: 'Usuário não encontrado!'});
    }

    res.status(200).json({ user });

});

// middleware que verifica o token
function checkToken(req, res, next) {

    console.log(req.headers);

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: 'Acesso negado!' });
    }

    try {

        const secret = process.env.SECRET

        jwt.verify(token, secret);

        next();

    } catch (err) {
        return res.status(400).json({ msg: 'Token inválido!' });
    }

}

// Credencials
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose
    .connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.edzclio.mongodb.net/`)
    .then(() => {
        app.listen(3000);                       // rodando a aplicação
        console.log('Conectou ao banco!');      
    })
    .catch((err) => console.log(err))