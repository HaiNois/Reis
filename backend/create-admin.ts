import prisma from './src/config/database.js'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Creating admin user...')

  const hashedPassword = await bcrypt.hash('123456', 12)

  const user = await prisma.user.upsert({
    where: { email: 'reis@gmail.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'reis@gmail.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Rei.s',
      role: 'ADMIN',
    },
  })

  console.log('Admin user created:', user.email, '| Role:', user.role)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
