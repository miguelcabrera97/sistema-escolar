import * as fs from 'fs'
import * as path from 'path'

console.log('Test script started')

try {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20251125_add_auxiliar_role.sql')
    console.log('Migration path:', migrationPath)

    if (fs.existsSync(migrationPath)) {
        console.log('Migration file exists')
        const content = fs.readFileSync(migrationPath, 'utf8')
        console.log('Content length:', content.length)
    } else {
        console.error('Migration file does NOT exist')
    }

    fs.writeFileSync('test-output.log', 'Test success')
    console.log('Wrote test-output.log')

} catch (e) {
    console.error('Error:', e)
}
