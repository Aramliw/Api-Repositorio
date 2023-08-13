const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS arquivos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      categoria TEXT, 
      arquivo TEXT,
      data TEXT,
      adicionadopor TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT, 
        senha TEXT
      )`);
});

process.on('SIGINT', () => {
    db.close(() => {
        console.log('Conexão com o banco de dados fechada.');
        process.exit(0);
    });
});

app.get('/arquivos/listar', (req, res) => {
    db.all('SELECT * FROM arquivos', (err, rows) => {
        if (err) {
          res.status(500).json({ erro: err.message });
          return;
        }
        res.json(rows);
      });
});

app.post('/arquivos/adicionar', upload.single('arquivo'), (req, res) => {
    let addarquivos = req.body;
    const arquivo = req.file;

    db.run('INSERT INTO arquivos (nome, categoria, arquivo, data, adicionadopor) VALUES (?, ?, ?, ?, ?)', [addarquivos.nome, addarquivos.categoria, arquivo.filename, new Date(), addarquivos.adicionadopor], function(err) {
      if (err) {
        res.status(500).json({ erro: err.message });
        return;
      }
      res.status(201).json({ mensagem: 'Novo arquivo adicionado com sucesso!'});
    });
});
app.post('/arquivos/filtrar', (req, res) => {
    let filtrar = req.body;
    res.json(filtrar);
});

app.post('/usuarios/login', (req, res) => {
    const user = req.body;
    db.get('SELECT * FROM usuarios WHERE email=? and senha=?', [user.email, user.senha],  (err, rows) => {
        if (err) {
          res.status(500).json({ erro: err.message });
          return;
        }
        if (rows == null) {
          res.status(400).json({ erro: 'usuário não existe' });
          return;
        }
        res.json(rows);
      });  
});

app.post('/usuarios/registrar', (req, res) => {
    const user = req.body;
    db.run('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [user.nome, user.email, user.senha], function(err) {
        if (err) {
          res.status(500).json({ erro: err.message });
          return;
        }
        res.status(201).json({ mensagem: 'Novo usuário cadastrado com sucesso'});
      });
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

