import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
        select: {
            email: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpires: true
        }
    })

    console.log('--- User Token Status ---')
    console.log('Email:', user?.email)
    console.log('Access Token Length:', user?.googleAccessToken?.length || 0)
    console.log('Refresh Token Length:', user?.googleRefreshToken?.length || 0)
    console.log('Expires At:', user?.googleTokenExpires)

    if (!user?.googleAccessToken) {
        console.error('ERROR: googleAccessToken is NULL. The user has NOT completed the OAuth flow.')
    } else {
        console.log('SUCCESS: Tokens exist.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
