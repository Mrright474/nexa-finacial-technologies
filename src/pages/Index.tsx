import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Packages } from '@/components/landing/Packages';
import { Stats } from '@/components/landing/Stats';
import { Security } from '@/components/landing/Security';
import { Download } from '@/components/landing/Download';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Packages />
        <Security />
        <Download />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
