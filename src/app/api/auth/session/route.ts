import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EMPLOYER } from '@/config';
// Import your master drizzle database client and the schema table we just looked at
import { db } from '@/lib/db'; 
import { enterprises } from '@/lib/db/schema'; // Update this path to match your schema file location
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    // 1. Direct Master Database Query - completely bypasses Supabase RLS gates
    let enterprise = await db
      .select({ id: enterprises.id })
      .from(enterprises)
      .where(eq(enterprises.walletAddress, walletAddress))
      .then((res) => res[0]);

    let enterpriseId: number;

    if (!enterprise) {
      // First-time signup sequence: Insert using clean Drizzle camelCase attributes
      const newCompany = await db
        .insert(enterprises)
        .values({
          walletAddress: walletAddress,
          companyName: 'ZetaPay Corporate Client',
          companyEmail: 'company@zetapay.com',
          country: 'US',
          isActive: true
        })
        .returning({ id: enterprises.id })
        .then((res) => res[0]);

      if (!newCompany) {
        throw new Error('Failed to insert new enterprise row into database.');
      }
      
      enterpriseId = newCompany.id;
    } else {
      enterpriseId = enterprise.id;
    }

    // 2. Assign secure server cookies
    const cookieStore = await cookies();
    cookieStore.set('zetaWallet', walletAddress, { httpOnly: true, secure: true, path: '/' });
    cookieStore.set('zetaRole', EMPLOYER, { httpOnly: true, secure: true, path: '/' });
    cookieStore.set('enterpriseId', String(enterpriseId), { httpOnly: true, secure: true, path: '/' });

    return NextResponse.json({ success: true, enterpriseId });
  } catch (error: any) {
    console.error('Drizzle Session API Error Context:', error);
    return NextResponse.json({ error: error?.message || 'Master database query failure' }, { status: 500 });
  }
}
