const { Pool, Client } = require('pg');

const pool = new Pool({
    user: 'zapchasty',
    host: '116.203.219.63',
    database: 'zapchasty',
    password: 'zapchasty_GfhjkzYtn321',
    port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res);
    pool.end()
});

const client = new Client({
    user: 'zapchasty',
    host: '116.203.219.63',
    database: 'zapchasty',
    password: 'zapchasty_GfhjkzYtn321',
    port: 5432,
});
client.connect();

client.query('SELECT NOW()', (err, res) => {
    console.log(err, res);
    client.end()
});
