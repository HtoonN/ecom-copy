import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'
import { databaseConfig } from '../src/lib/database-config'

const adapter = new PrismaMariaDb(databaseConfig())
const prisma = new PrismaClient({ adapter })

const IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
]
const GENDERS = ['ผู้ชาย', 'ผู้หญิง', 'ยูนิเซกส์', 'เด็ก']
const BRANDS = ['ADIDAS', 'ASICS', 'BABOLAT', 'BROOKS', 'CHAMPION', 'COLUMBIA']

const CATEGORY_PRODUCTS: [string, string, string][] = [
  ['เสื้อ', 'เสื้อกีฬาแขนสั้น Active', 'เสื้อวิ่งเนื้อผ้าระบายอากาศ น้ำหนักเบา'],
  ['เสื้อ', 'เสื้อฝึกซ้อม Pro Training', 'เสื้อฝึกซ้อมแห้งไว ใส่สบายทั้งวัน'],
  ['รองเท้า', 'รองเท้าวิ่ง Featherlight Marathon', 'รองเท้าวิ่งมาราธอน ระบายอากาศดี'],
  ['รองเท้า', 'รองเท้าเทรล Bounce Comfort', 'รองเท้าวิ่ง เน้นความนุ่มสบาย'],
  ['กางเกง', 'กางเกงวิ่งขาสั้น Sprint', 'กางเกงขาสั้นเนื้อผ้ายืดหยุ่นสูง'],
  ['กางเกง', 'กางเกงโยคะ Flex Fit', 'กางเกงโยคะเอวสูง กระชับสัดส่วน'],
  ['กระโปรง', 'กระโปรงเทนนิส Ace Skirt', 'กระโปรงกีฬาพร้อมกางเกงในสำเร็จรูป'],
  ['กระโปรง', 'กระโปรงวิ่ง Light Run', 'กระโปรงวิ่งน้ำหนักเบา ระบายอากาศ'],
  ['ชุดโยคะ, พิลาทีส', 'ชุดเดรสโยคะ Studio Wrap', 'ชุดเดรสสำหรับโยคะและพิลาทิส'],
  ['ชุดโยคะ, พิลาทีส', 'ชุดพิลาทิส Core Set', 'ชุดออกกำลังกายเน้นความยืดหยุ่น'],
  ['ลูกบอลและลูกกีฬา', 'ลูกฟุตบอลมาตรฐาน Match Ball', 'ลูกฟุตบอลแข่งขันมาตรฐาน FIFA'],
  ['ลูกบอลและลูกกีฬา', 'ลูกบาสเกตบอล Indoor Pro', 'ลูกบาสเกตบอลสำหรับใช้ในร่ม'],
  ['แร็กเกตและไม้ตี', 'แร็กเกตเทนนิส Power Swing', 'แร็กเกตเทนนิสน้ำหนักเบา ควบคุมง่าย'],
  ['แร็กเกตและไม้ตี', 'ไม้แบดมินตัน Sky Strike', 'ไม้แบดมินตันสำหรับผู้เล่นระดับกลาง'],
  ['อุปกรณ์วิ่ง', 'เข็มขัดใส่ขวดน้ำ Runner Belt', 'เข็มขัดวิ่งพร้อมที่ใส่ขวดน้ำ'],
  ['อุปกรณ์วิ่ง', 'ไฟฉายคาดหัววิ่งกลางคืน Night Run', 'ไฟส่องสว่างสำหรับวิ่งกลางคืน'],
  ['อุปกรณ์กีฬากลางแจ้ง', 'เต็นท์แคมป์ปิ้ง Outdoor Base', 'เต็นท์กันน้ำสำหรับตั้งแคมป์ 2 คน'],
  ['อุปกรณ์กีฬากลางแจ้ง', 'เป้สะพายหลังเดินป่า Trail Pack', 'เป้เดินป่าความจุ 30 ลิตร'],
  ['อุปกรณ์กีฬาทางน้ำ', 'แว่นตาว่ายน้ำ Aqua Vision', 'แว่นตาว่ายน้ำกันฝ้า ป้องกันรังสียูวี'],
  ['อุปกรณ์กีฬาทางน้ำ', 'ชุดว่ายน้ำ Speed Fin', 'ชุดว่ายน้ำแข่งขันเนื้อผ้าลดแรงเสียดทาน'],
]

async function main() {
  const shop = await prisma.shop.findUnique({ where: { slug: 'studio-north' } })
  if (!shop) throw new Error('Seed the base data first: npm run db:seed')

  let created = 0
  for (const [index, [category, name, description]] of CATEGORY_PRODUCTS.entries()) {
    const slug = `${name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${index + 1}`
    const priceCents = 29900 + ((index * 137) % 27) * 1000
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        shopId: shop.id,
        name,
        slug,
        category,
        description,
        imageUrls: [IMAGES[index % IMAGES.length]],
        priceCents,
        gender: GENDERS[index % GENDERS.length],
        sport: category,
        brand: BRANDS[index % BRANDS.length],
        listingMode: 'AFFILIATE',
        affiliateUrl: [`https://s.shopee.co.th/mock-${slug}`],
        active: true,
      },
    })
    created += 1
  }
  console.log(`Seeded ${created} category products into shop "${shop.name}".`)
}

main().finally(() => prisma.$disconnect())
