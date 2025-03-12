const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
const app = express();
const port = 3000;

// Configuração do banco de dados
const db = new sqlite3.Database('./trading-journal.db'); // Adicionado ./

// Configurar CORS
app.use(cors());

// Configurações essenciais
app.use(express.static('public')); // Para servir HTML/CSS/JS
app.use('/uploads', express.static('uploads')); // Para servir imagens

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Adicionado :

// Configurar Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => { // Corrigido arrow function
    cb(null, 'uploads/'); // Adicionado /
  },
  filename: (req, file, cb) => { // Corrigido arrow function
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Criar tabela de trades
db.serialize(() => { // Corrigido arrow function
  db.run(`CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    ativo TEXT NOT NULL,
    evento TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    resultado TEXT NOT NULL,
    erros TEXT NOT NULL,
    observacao TEXT,
    foto TEXT
  )`);
});

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads')); // Adicionado /

app.get('/trades', (req, res) => { // Adicionado /
  db.all('SELECT * FROM trades', (err, rows) => { // Adicionado *
    if (err) {
      res.status(500).json({ error: err.message }); // Adicionado :
      return;
    }
    res.json(rows);
  });
});

app.post('/trades', upload.single('foto'), (req, res) => {
    const { data, ativo, evento, localizacao, resultado, erros, observacao } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : null;

    const stmt = db.prepare(`INSERT INTO trades (
        data, ativo, evento, localizacao, resultado, erros, observacao, foto
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  
    stmt.run(
        data,
        ativo,
        evento,
        localizacao,
        resultado,
        erros,
        observacao,
        foto,
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Trade adicionado com sucesso!' });
        }
    );

    stmt.finalize();
});

// Remover o trade da tabela e o arquivo fisico
app.delete('/trades/:id', (req, res) => {
    const tradeId = req.params.id;

    // Primeiro busca o trade para obter o caminho da foto
    db.get('SELECT foto FROM trades WHERE id = ?', [tradeId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: 'Trade não encontrado' });
        }

        // Apaga o arquivo físico se existir
        if (row.foto) {
            const filePath = path.join(__dirname, row.foto.replace('/uploads/', 'uploads/'));
            
            fs.unlink(filePath, (unlinkErr) => {
                // Ignora erro se o arquivo não existir
                if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                    console.error('Erro ao deletar arquivo:', unlinkErr);
                }
            });
        }

        // Depois apaga o registro do banco
        db.run(
            'DELETE FROM trades WHERE id = ?',
            [tradeId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Trade não encontrado' });
                }

                res.json({ 
                    message: 'Trade e arquivo removidos com sucesso!',
                    changes: this.changes 
                });
            }
        );
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
