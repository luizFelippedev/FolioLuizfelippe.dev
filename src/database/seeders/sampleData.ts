import type { CreateBlogPostInput } from '@validators/blog.validator';
import type { CreateCertificateInput } from '@validators/certificate.validator';
import type { CreateProjectInput } from '@validators/project.validator';
import type { CreateTestimonialInput } from '@validators/testimonial.validator';

export const projectSeedData: CreateProjectInput[] = [
  {
    title: 'Nebula UI Dashboard',
    slug: 'nebula-ui-dashboard',
    description: 'Responsive analytics dashboard featuring real-time charts, theming, and AI-assisted insights.',
    category: 'dashboard',
    technologies: ['React', 'TypeScript', 'Three.js'],
    gallery: [],
    featured: true,
    order: 1,
    metrics: { views: 0, stars: 120 }
  },
  {
    title: 'Quantum Commerce',
    slug: 'quantum-commerce',
    description: 'Immersive e-commerce experience with holographic product previews and voice-enabled search.',
    category: 'ecommerce',
    technologies: ['Next.js', 'Tailwind', 'Stripe'],
    gallery: [],
    featured: false,
    order: 2,
    metrics: { views: 0, stars: 98 }
  }
];

export const certificateSeedData: CreateCertificateInput[] = [
  {
    title: 'Advanced Neural Interfaces',
    slug: 'advanced-neural-interfaces-cert',
    issuer: 'Future Labs Institute',
    issueDate: new Date('2023-05-01'),
    category: 'data',
    level: 'advanced',
    skills: ['Neural Networks', 'Edge AI'],
    highlights: []
  },
  {
    title: 'Quantum UX Foundations',
    slug: 'quantum-ux-foundations',
    issuer: 'Interstellar Design School',
    issueDate: new Date('2022-11-01'),
    category: 'design',
    level: 'intermediate',
    skills: ['Design Systems', 'Accessibility'],
    highlights: []
  }
];

export const blogSeedData: CreateBlogPostInput[] = [
  {
    title: 'Designing Interfaces for Mixed Reality',
    slug: 'mixed-reality-interface-design',
    excerpt: 'Guidelines and patterns for crafting intuitive mixed reality experiences in futuristic products.',
    content:
      '# Mixed Reality Interfaces\n\nExplore how spatial design, gesture vocabularies, and audio cues converge to create intuitive MR experiences.',
    categories: ['design', 'mixed-reality'],
    tags: ['design', 'mixed-reality'],
    readTime: 7,
    published: true,
    publishedAt: new Date('2024-01-10'),
    seo: {
      title: 'Mixed Reality Interface Design Principles',
      description: 'A reference guide for creating usable MR products.'
    }
  },
  {
    title: 'Building AI-Driven Portfolios',
    slug: 'ai-driven-portfolios',
    excerpt: 'How to showcase projects with live analytics, AI summaries, and multi-modal storytelling.',
    content:
      '# AI-Driven Portfolios\n\nLeverage machine learning to personalise case studies, recommend content, and track engagement in real time.',
    categories: ['ai', 'portfolio'],
    tags: ['ai', 'portfolio'],
    readTime: 6,
    published: true,
    publishedAt: new Date('2024-02-05'),
    seo: {
      title: 'AI-Powered Portfolio Experiences',
      description: 'Turn static portfolios into adaptive experiences with AI.'
    }
  }
];

export const testimonialSeedData: CreateTestimonialInput[] = [
  {
    name: 'Ari Vega',
    company: 'Orion Labs',
    role: 'CTO',
    message:
      'An exceptional partner for futuristic product development. Delivered interactive holographic dashboards ahead of schedule.',
    rating: 5,
    isFeatured: true,
    isApproved: true
  },
  {
    name: 'Mira Solis',
    company: 'Nova Creative',
    role: 'Design Director',
    message:
      'Brought a visionary approach to our immersive brand experience. The technical finesse with 3D + realtime data was outstanding.',
    rating: 5,
    isFeatured: false,
    isApproved: true
  }
];
