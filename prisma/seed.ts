import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Passing log options to satisfy "non-empty" check
// We assume engineType="library" is set in schema.prisma now.
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
})

async function main() {
    const password = await bcrypt.hash('password123', 10)
    const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            password,
            role: 'ADMIN',
            status: 'APPROVED',
        },
    })
    console.log('Seeded User:', user)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
