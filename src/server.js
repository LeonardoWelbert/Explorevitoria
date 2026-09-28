const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnv = requiredEnv.filter((name) => process.env[name] === undefined);

if (missingEnv.length > 0) {
    console.error(`Configure as variáveis ${missingEnv.join(', ')} no arquivo ${path.join(__dirname, '.env')}.`);
    process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexão usando variáveis de ambiente de forma segura
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Rota de Contato
app.post('/api/contato', (req, res) => {
    const { nome, email, telefone, mensagem } = req.body;

    if (!nome || !email || !telefone) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Campos obrigatórios ausentes.'
        });
    }

    const sql = `
        INSERT INTO contatos_viagem (nome, email, telefone, mensagem) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [nome, email, telefone, mensagem || ''], (err, result) => {
        if (err) {
            console.error('Erro ao salvar no MySQL:', err);
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao salvar os dados no servidor.'
            });
        }

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Contato cadastrado com sucesso!'
        });
    });
});

const createContactsTable = `
    CREATE TABLE IF NOT EXISTS contatos_viagem (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(254) NOT NULL,
        telefone VARCHAR(40) NOT NULL,
        mensagem TEXT NOT NULL,
        criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

db.query(createContactsTable, (err) => {
    if (err) {
        console.error('Erro ao preparar a tabela de contatos:', err.message);
        process.exit(1);
    }

    console.log('Tabela de contatos pronta.');
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
});