import bcrypt from 'bcryptjs'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient, Role } from '../src/generated/prisma/client'
import { ListingMode } from '../src/generated/prisma/enums'
import { databaseConfig } from '../src/lib/database-config'

const adapter = new PrismaMariaDb(databaseConfig())
const prisma = new PrismaClient({ adapter })

type DemoProduct = {
  sku: string
  name: string
  category: string
  productType: string
  sport: string
  gender: string
  brand: string
  priceCents: number
  description: string
}

const DEMO_PRODUCTS: DemoProduct[] = [
  { sku: 'NS-1001', name: 'Pro Training Tee', category: 'เสื้อ', productType: 'เสื้อ', sport: 'Running', gender: 'Men', brand: 'Nike', priceCents: 59000, description: 'Sweat-wicking training tee built for daily mileage.' },
  { sku: 'NS-1002', name: 'Yoga Flow Tank Top', category: 'เสื้อ', productType: 'เสื้อ', sport: 'Yoga, Pilates', gender: 'Women', brand: 'Lululemon', priceCents: 89000, description: 'Buttery-soft tank with four-way stretch for studio flow.' },
  { sku: 'NS-1003', name: 'Featherlight Marathon Runner', category: 'รองเท้า', productType: 'รองเท้า', sport: 'Running', gender: 'Unisex', brand: 'Hoka', priceCents: 320000, description: 'Max-cushion marathon shoe with a rockered ride.' },
  { sku: 'NS-1004', name: 'Court Grip Basketball Shoes', category: 'รองเท้า', productType: 'รองเท้า', sport: 'Basketball', gender: 'Men', brand: 'Nike', priceCents: 290000, description: 'High-traction outsole for explosive court cuts.' },
  { sku: 'NS-1005', name: 'Aqua Trainer Water Shoes', category: 'รองเท้า', productType: 'รองเท้า', sport: 'Water Sports', gender: 'Unisex', brand: 'Speedo', priceCents: 120000, description: 'Quick-drain water shoe with a grippy rubber sole.' },
  { sku: 'NS-1006', name: 'Cushion Trail Running Shoes', category: 'รองเท้า', productType: 'รองเท้า', sport: 'Running', gender: 'Women', brand: 'Saucony', priceCents: 340000, description: 'Trail-ready cushioning with a durable grip pattern.' },
  { sku: 'NS-1007', name: 'Sprint Running Shorts', category: 'กางเกง', productType: 'กางเกง', sport: 'Running', gender: 'Men', brand: 'Under Armour', priceCents: 69000, description: 'Lightweight liner shorts with a zip pocket.' },
  { sku: 'NS-1008', name: 'Flex High-Waist Leggings', category: 'กางเกง', productType: 'กางเกง', sport: 'Yoga, Pilates', gender: 'Women', brand: 'Lululemon', priceCents: 149000, description: 'Squat-proof high-waist leggings with side pockets.' },
  { sku: 'NS-1009', name: 'Court Tennis Shorts', category: 'กางเกง', productType: 'กางเกง', sport: 'Tennis', gender: 'Men', brand: 'Wilson', priceCents: 79000, description: 'Breathable tennis shorts with ball pockets.' },
  { sku: 'NS-1010', name: 'Ace Tennis Skirt', category: 'กระโปรง', productType: 'กระโปรง', sport: 'Tennis', gender: 'Women', brand: 'Wilson', priceCents: 99000, description: 'Pleated tennis skirt with built-in shorts.' },
  { sku: 'NS-1011', name: 'Studio Wrap Yoga Set', category: 'ชุดโยคะ, พิลาทีส', productType: 'ชุดโยคะ, พิลาทีส', sport: 'Yoga, Pilates', gender: 'Women', brand: 'Lululemon', priceCents: 169000, description: 'Matching wrap top and legging set for studio sessions.' },
  { sku: 'NS-1012', name: 'Match Ball Pro Football', category: 'ลูกบอลและลูกกีฬา', productType: 'ลูกบอลและลูกกีฬา', sport: 'Football', gender: 'Unisex', brand: 'Adidas', priceCents: 89000, description: 'FIFA-standard match ball with textured control panels.' },
  { sku: 'NS-1013', name: 'Tournament Shuttlecocks (Tube of 12)', category: 'ลูกบอลและลูกกีฬา', productType: 'ลูกบอลและลูกกีฬา', sport: 'Badminton', gender: 'Unisex', brand: 'Yonex', priceCents: 69000, description: 'Goose-feather shuttlecocks for competitive play.' },
  { sku: 'NS-1014', name: 'Indoor Pro Basketball', category: 'ลูกบอลและลูกกีฬา', productType: 'ลูกบอลและลูกกีฬา', sport: 'Basketball', gender: 'Unisex', brand: 'Molten', priceCents: 129000, description: 'Composite-leather basketball for indoor courts.' },
  { sku: 'NS-1015', name: 'Power Swing Tennis Racket', category: 'แร็กเกตและไม้ตี', productType: 'แร็กเกตและไม้ตี', sport: 'Tennis', gender: 'Unisex', brand: 'Wilson', priceCents: 390000, description: 'Lightweight racket frame built for fast swings.' },
  { sku: 'NS-1016', name: 'Sky Strike Badminton Racket', category: 'แร็กเกตและไม้ตี', productType: 'แร็กเกตและไม้ตี', sport: 'Badminton', gender: 'Unisex', brand: 'Yonex', priceCents: 290000, description: 'Mid-level racket balancing power and control.' },
  { sku: 'NS-1017', name: 'Table Tennis Paddle Set', category: 'แร็กเกตและไม้ตี', productType: 'แร็กเกตและไม้ตี', sport: 'Table Tennis', gender: 'Unisex', brand: 'Butterfly', priceCents: 159000, description: 'Two paddles, three balls, and a carry case.' },
  { sku: 'NS-1018', name: 'Pickleball Paddle & Ball Set', category: 'แร็กเกตและไม้ตี', productType: 'แร็กเกตและไม้ตี', sport: 'Pickleball', gender: 'Unisex', brand: 'Wilson', priceCents: 189000, description: 'Fiberglass paddles with four outdoor balls.' },
  { sku: 'NS-1019', name: 'Runner Hydration Belt', category: 'อุปกรณ์วิ่ง', productType: 'อุปกรณ์วิ่ง', sport: 'Running', gender: 'Unisex', brand: 'Hoka', priceCents: 89000, description: 'Bounce-free belt with two 250ml flasks.' },
  { sku: 'NS-1020', name: 'GPS Running Watch', category: 'อุปกรณ์วิ่ง', productType: 'อุปกรณ์วิ่ง', sport: 'Running', gender: 'Unisex', brand: 'Garmin', priceCents: 890000, description: 'GPS pace tracking with 14-day battery life.' },
  { sku: 'NS-1021', name: 'Trail Camping Tent 2P', category: 'อุปกรณ์กีฬากลางแจ้ง', productType: 'อุปกรณ์กีฬากลางแจ้ง', sport: 'Outdoor Sports', gender: 'Unisex', brand: 'Snow Peak', priceCents: 690000, description: 'Two-person freestanding tent for weekend trips.' },
  { sku: 'NS-1022', name: 'Trail Hiking Backpack 30L', category: 'อุปกรณ์กีฬากลางแจ้ง', productType: 'อุปกรณ์กีฬากลางแจ้ง', sport: 'Outdoor Sports', gender: 'Unisex', brand: 'Salomon', priceCents: 320000, description: 'Ventilated hiking pack with a hydration sleeve.' },
  { sku: 'NS-1023', name: 'Insulated Steel Bottle', category: 'อุปกรณ์กีฬากลางแจ้ง', productType: 'อุปกรณ์กีฬากลางแจ้ง', sport: 'Outdoor Sports', gender: 'Unisex', brand: 'Stanley', priceCents: 119000, description: 'Keeps drinks cold for 24 hours or hot for 12.' },
  { sku: 'NS-1024', name: 'Anti-Fog Racing Goggles', category: 'อุปกรณ์กีฬาทางน้ำ', productType: 'อุปกรณ์กีฬาทางน้ำ', sport: 'Water Sports', gender: 'Unisex', brand: 'Speedo', priceCents: 59000, description: 'UV-protected lenses with an anti-fog coating.' },
  { sku: 'NS-1025', name: 'Competition Swim Cap', category: 'อุปกรณ์กีฬาทางน้ำ', productType: 'อุปกรณ์กีฬาทางน้ำ', sport: 'Water Sports', gender: 'Unisex', brand: 'Arena', priceCents: 29000, description: 'Low-drag silicone cap for race day.' },
  { sku: 'NS-1026', name: 'Everyday Sports Duffel Bag', category: 'อุปกรณ์กีฬากลางแจ้ง', productType: 'อุปกรณ์กีฬากลางแจ้ง', sport: 'Outdoor Sports', gender: 'Unisex', brand: 'Under Armour', priceCents: 129000, description: 'Ventilated shoe compartment and wide-mouth opening.' },
  { sku: 'NS-1027', name: 'Premium Yoga Mat', category: 'ชุดโยคะ, พิลาทีส', productType: 'ชุดโยคะ, พิลาทีส', sport: 'Yoga, Pilates', gender: 'Unisex', brand: 'Lululemon', priceCents: 199000, description: 'Non-slip 5mm mat with a natural rubber base.' },
  { sku: 'NS-1028', name: 'Sports Performance Sunglasses', category: 'อุปกรณ์กีฬากลางแจ้ง', productType: 'อุปกรณ์กีฬากลางแจ้ง', sport: 'Outdoor Sports', gender: 'Unisex', brand: 'On Running', priceCents: 249000, description: 'Polarized lenses with a lightweight wraparound frame.' },
  { sku: 'NS-1029', name: 'Compression Socks 3-Pack', category: 'อุปกรณ์วิ่ง', productType: 'อุปกรณ์วิ่ง', sport: 'Running', gender: 'Unisex', brand: 'Under Armour', priceCents: 49000, description: 'Graduated compression for recovery and long runs.' },
  { sku: 'NS-1030', name: 'Resistance Bands Training Set', category: 'อุปกรณ์กีฬากลางแจ้ง', productType: 'อุปกรณ์กีฬากลางแจ้ง', sport: 'Indoor Sports', gender: 'Unisex', brand: 'Grand Sport', priceCents: 39000, description: 'Five resistance levels with a door anchor and guide.' },
]

// Exact 10-item list provided for the "product type" option set.
const PRODUCT_TYPES: [string, string][] = [
  ['Shirt', 'เสื้อ'],
  ['Shoes', 'รองเท้า'],
  ['Shorts & Pants', 'กางเกง'],
  ['Skirt', 'กระโปรง'],
  ['Yoga and Pilates Suit', 'ชุดโยคะ, พิลาทีส'],
  ['Sports Balls & Shuttlecocks', 'ลูกบอลและลูกกีฬา'],
  ['Racket & Bat Sports', 'แร็กเกตและไม้ตี'],
  ['Running & Athletics', 'อุปกรณ์วิ่ง'],
  ['Outdoor & Lifestyle Sports', 'อุปกรณ์กีฬากลางแจ้ง'],
  ['Swim & Water Sports', 'อุปกรณ์กีฬาทางน้ำ'],
]

const CATEGORIES: [string, string][] = [
  ['Sports Apparel', 'เครื่องแต่งกาย'],
  ['Sports Footwear', 'รองเท้า'],
  ['Sports Equipment & Gear', 'อุปกรณ์กีฬา'],
  ['Accessories & Others', 'อุปกรณ์เสริม'],
  ['Others', 'อื่นๆ'],
]

const BRANDS = [
  'Adidas',
  'Arena',
  'Ari',
  'ASICS',
  'Brooks',
  'Butterfly',
  'FBT',
  'FootJoy',
  'Franklin',
  'Garmin',
  'Gosen',
  'Grand Sport',
  'Harbinger',
  'Hoka',
  'Jason',
  'Joola',
  'Kailas',
  'Li-Ning',
  'Lululemon',
  'Mizuno',
  'Molten',
  'New Balance',
  'Nike',
  'On Running',
  'Pan',
  'Puma',
  'Rapha',
  'Salomon',
  'Saucony',
  'Scubapro',
  'Shimano',
  'Shokz',
  'Sketchers',
  'Snow Peak',
  'Speedo',
  'Stanley',
  'Stiga',
  'Under Armour',
  'Victor',
  'Warrix',
  'Wilson',
  'Yonex',
]

const SPORTS: [string, string][] = [
  ['Running', 'วิ่ง'],
  ['Badminton', 'แบดมินตัน'],
  ['Basketball', 'บาสเกตบอล'],
  ['Football', 'ฟุตบอล'],
  ['Tennis', 'เทนนิส'],
  ['Table Tennis', 'เทเบิลเทนนิส'],
  ['Pickleball', 'พิคเคิลบอล'],
  ['Yoga, Pilates', 'โยคะ, พิลาทิส'],
  ['Indoor Sports', 'กีฬาในร่ม'],
  ['Outdoor Sports', 'กีฬากลางแจ้ง'],
  ['Water Sports', 'กีฬาทางน้ำ'],
]

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10)
  const [admin, customer, vendor] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@northstar.local' },
      update: {},
      create: {
        name: 'Avery Admin',
        email: 'admin@northstar.local',
        passwordHash,
        role: Role.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: 'customer@northstar.local' },
      update: {},
      create: {
        name: 'Casey Morgan',
        email: 'customer@northstar.local',
        passwordHash,
        role: Role.CUSTOMER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'vendor@northstar.local' },
      update: {},
      create: {
        name: 'Jordan Lee',
        email: 'vendor@northstar.local',
        passwordHash,
        role: Role.VENDOR,
      },
    }),
  ])
  await prisma.address.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: customer.id,
      label: 'Home',
      recipient: customer.name,
      phone: '+66 81 234 5678',
      line1: '42 Sukhumvit Road',
      city: 'Bangkok',
      postalCode: '10110',
      isDefault: true,
    },
  })
  const shop = await prisma.shop.upsert({
    where: { ownerId: vendor.id },
    update: { address: 'Bangkok, Thailand' },
    create: {
      ownerId: vendor.id,
      name: 'Studio North',
      slug: 'studio-north',
      description: 'Considered goods for modern everyday life.',
      address: 'Bangkok, Thailand',
    },
  })
  for (const [index, item] of DEMO_PRODUCTS.entries()) {
    const slug = item.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    // Every product is an affiliate listing (no real affiliate integration exists, so
    // these links are placeholders). Most alternate Shopee/Lazada; every 5th product
    // gets both, to exercise the multi-marketplace display.
    const shopeeUrl = `https://s.shopee.co.th/mock-${slug}`
    const lazadaUrl = `https://s.lazada.co.th/mock-${slug}`
    const affiliateUrl =
      index % 5 === 4 ? [shopeeUrl, lazadaUrl] : index % 2 === 0 ? [shopeeUrl] : [lazadaUrl]
    const imageUrls = [1, 2, 3].map(
      (variant) => `https://picsum.photos/seed/${slug}-${variant}/900/900`,
    )
    await prisma.product.upsert({
      where: { slug },
      update: {
        imageUrls,
        category: item.category,
        productType: item.productType,
        sport: item.sport,
        gender: item.gender,
        brand: item.brand,
        description: item.description,
        priceCents: item.priceCents,
      },
      create: {
        shopId: shop.id,
        name: item.name,
        sku: item.sku,
        slug,
        category: item.category,
        productType: item.productType,
        sport: item.sport,
        gender: item.gender,
        brand: item.brand,
        description: item.description,
        imageUrls,
        priceCents: item.priceCents,
        listingMode: ListingMode.AFFILIATE,
        affiliateUrl,
        active: true,
      },
    })
  }
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { shopId: shop.id, code: 'WELCOME10', type: 'PERCENT', value: 10, minimumCents: 5000 },
  })
  await Promise.all(
    PRODUCT_TYPES.map(([nameEn, nameTh], sortOrder) =>
      prisma.productType.upsert({
        where: { nameEn },
        update: { nameTh, sortOrder },
        create: { nameEn, nameTh, sortOrder },
      }),
    ),
  )
  // Retired option, no longer part of the 10-item list above.
  await prisma.productType.deleteMany({ where: { nameEn: 'Accessories & Others' } })
  await Promise.all(
    BRANDS.map((name, sortOrder) =>
      prisma.brand.upsert({
        where: { nameEn: name },
        update: { nameTh: name, sortOrder },
        create: { nameEn: name, nameTh: name, sortOrder },
      }),
    ),
  )
  await Promise.all(
    CATEGORIES.map(([nameEn, nameTh], sortOrder) =>
      prisma.category.upsert({
        where: { nameEn },
        update: { nameTh, sortOrder },
        create: { nameEn, nameTh, sortOrder },
      }),
    ),
  )
  await Promise.all(
    SPORTS.map(([nameEn, nameTh], sortOrder) =>
      prisma.sport.upsert({
        where: { nameEn },
        update: { nameTh, sortOrder },
        create: { nameEn, nameTh, sortOrder },
      }),
    ),
  )
  console.log(`Seeded ${admin.email}, ${customer.email}, and ${vendor.email}`)
}

main().finally(() => prisma.$disconnect())
