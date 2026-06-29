import { Hero } from '@/components/home/Hero';
import { Features } from '@/components/home/Features';
import { AccessViews } from '@/components/home/AccessViews';
import { PayrollFlow } from '@/components/home/PayrollFlow';
import { SecurityModel } from '@/components/home/SecurityModel';
import { Roadmap } from '@/components/home/Roadmap';
import { CTA } from '@/components/home/CTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <AccessViews />
      <PayrollFlow />
      <SecurityModel />
      <Roadmap />
      <CTA />
    </>
  );
}
