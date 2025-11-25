import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import pg from 'pg'
const { Client } = pg

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading env from:', envPath)
dotenv.config({ path: envPath })

async function applyMigration() {
    console.log('Starting migration script...')

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is missing')
        process.exit(1)
    }

    // Mask password for logging
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@')
    console.log('Database URL:', maskedUrl)

    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251125_add_auxiliar_role.sql')
    console.log('Migration path:', migrationPath)

    try {
        const sql = fs.readFileSync(migrationPath, 'utf8')
        console.log('SQL loaded, length:', sql.length)

        const client = new Client({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false }
        })

        console.log('Connecting to DB...')
        await client.connect()
        console.log('✅ Connected to DB')

        console.log('Executing query...')
        await client.query(sql)
        console.log('✅ Query executed successfully')

        await client.end()
        console.log('Connection closed')

    } catch (error: any) {
        console.error('❌ Error during migration:')
        console.error(error)
        process.exit(1)
    }
}

applyMigration()
