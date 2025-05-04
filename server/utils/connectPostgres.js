import pg from "pg";

let pgClient;
const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cs23',
    password: 'p0stgres',
    port: 5432,
});

async function connectPostgres() {
    try {
        pgClient = await pool.connect();
        console.log('Connected to Postgres.');

    } catch (error) {
        console.log('Unable to connect Postgres!');
        return console.error(error);
    }
}

connectPostgres();

export { pool, pgClient };