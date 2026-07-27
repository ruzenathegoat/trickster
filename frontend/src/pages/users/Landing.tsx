import NavBar from '@/components/landing/NavBar';
import HeroSection from '@/components/landing/HeroSection';
import TrustedBySection from '@/components/landing/TrustedBySection';
import WhyTricksterSection from '@/components/landing/WhyTricksterSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import RecommendationPreviewSection from '@/components/landing/RecommendationPreviewSection';
import PlayerProfilePreviewSection from '@/components/landing/PlayerProfilePreviewSection';
import TeamSimulationPreviewSection from '@/components/landing/TeamSimulationPreviewSection';
import DashboardPreviewSection from '@/components/landing/DashboardPreviewSection';
import TechMethodologySection from '@/components/landing/TechMethodologySection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] font-['Inter'] selection:bg-[var(--color-primary-container)] selection:text-[var(--color-on-background)] relative">
      <NavBar />
      
      {/* 1. Hero */}
      <HeroSection />
      
      {/* 2. Trusted By / Social Proof */}
      <TrustedBySection />
      
      {/* 3. Why Trickster Exists */}
      <WhyTricksterSection />
      
      {/* 4. Core Features */}
      <FeaturesSection />
      
      {/* 5. How It Works */}
      <HowItWorksSection />
      
      {/* 6. Recommendation Preview */}
      <RecommendationPreviewSection />
      
      {/* 7. Player Profile Preview */}
      <PlayerProfilePreviewSection />
      
      {/* 8. Team Simulation Preview */}
      <TeamSimulationPreviewSection />
      
      {/* 9. Dashboard Preview */}
      <DashboardPreviewSection />
      
      {/* 10. Technology & Methodology */}
      <TechMethodologySection />
      
      {/* 11. FAQ */}
      <FAQSection />
      
      {/* 12. CTA */}
      <CTASection />
      
      {/* 13. Footer */}
      <Footer />
    </div>
  );
}
