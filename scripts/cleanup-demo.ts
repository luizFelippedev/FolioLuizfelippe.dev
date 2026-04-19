import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import env from '../src/config/env.config';
import connectDatabase, { disconnectDatabase } from '../src/database/connection';
import BlogPostModel from '../src/models/BlogPost.model';
import CertificateModel from '../src/models/Certificate.model';
import ProjectModel from '../src/models/Project.model';
import TestimonialModel from '../src/models/Testimonial.model';
import logger from '../src/utils/logger/logger';

interface CleanupOptions {
  dryRun: boolean;
}

interface CleanupResult {
  collection: string;
  matched: number;
  deleted: number;
}

const parseArgs = (): CleanupOptions => {
  const argv = yargs(hideBin(process.argv))
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'List the demo records that would be removed without deleting data'
    })
    .help()
    .parseSync();

  return {
    dryRun: Boolean(argv['dry-run'])
  };
};

const DEMO_MATCHERS = {
  projects: {
    slug: ['nebula-ui-dashboard', 'quantum-commerce'],
    title: ['Nebula UI Dashboard', 'Quantum Commerce']
  },
  certificates: {
    slug: ['advanced-neural-interfaces-cert', 'quantum-ux-foundations'],
    title: ['Advanced Neural Interfaces', 'Quantum UX Foundations']
  },
  blog: {
    slug: ['mixed-reality-interface-design', 'ai-driven-portfolios'],
    title: ['Designing Interfaces for Mixed Reality', 'Building AI-Driven Portfolios']
  },
  testimonials: {
    name: ['Ari Vega', 'Mira Solis']
  }
} as const;

const main = async () => {
  const options = parseArgs();
  logger.info(`cleanup-demo started in ${env.NODE_ENV} mode`, options);

  await connectDatabase();

  try {
    const results: CleanupResult[] = [];

    const projectFilter = {
      $or: [{ slug: { $in: [...DEMO_MATCHERS.projects.slug] } }, { title: { $in: [...DEMO_MATCHERS.projects.title] } }]
    };
    const certificateFilter = {
      $or: [
        { slug: { $in: [...DEMO_MATCHERS.certificates.slug] } },
        { title: { $in: [...DEMO_MATCHERS.certificates.title] } }
      ]
    };
    const blogFilter = {
      $or: [{ slug: { $in: [...DEMO_MATCHERS.blog.slug] } }, { title: { $in: [...DEMO_MATCHERS.blog.title] } }]
    };
    const testimonialFilter = {
      name: { $in: [...DEMO_MATCHERS.testimonials.name] }
    };

    const projectMatches = await ProjectModel.find(projectFilter, { slug: 1, title: 1 }).lean();
    const certificateMatches = await CertificateModel.find(certificateFilter, { slug: 1, title: 1 }).lean();
    const blogMatches = await BlogPostModel.find(blogFilter, { slug: 1, title: 1 }).lean();
    const testimonialMatches = await TestimonialModel.find(testimonialFilter, { name: 1 }).lean();

    if (options.dryRun) {
      logger.info('[dry-run] Demo projects', projectMatches);
      logger.info('[dry-run] Demo certificates', certificateMatches);
      logger.info('[dry-run] Demo blog posts', blogMatches);
      logger.info('[dry-run] Demo testimonials', testimonialMatches);
    }

    const projectDeleteResult = options.dryRun ? { deletedCount: 0 } : await ProjectModel.deleteMany(projectFilter);
    const certificateDeleteResult = options.dryRun ? { deletedCount: 0 } : await CertificateModel.deleteMany(certificateFilter);
    const blogDeleteResult = options.dryRun ? { deletedCount: 0 } : await BlogPostModel.deleteMany(blogFilter);
    const testimonialDeleteResult = options.dryRun ? { deletedCount: 0 } : await TestimonialModel.deleteMany(testimonialFilter);

    results.push(
      {
        collection: 'projects',
        matched: projectMatches.length,
        deleted: projectDeleteResult.deletedCount ?? 0
      },
      {
        collection: 'certificates',
        matched: certificateMatches.length,
        deleted: certificateDeleteResult.deletedCount ?? 0
      },
      {
        collection: 'blog',
        matched: blogMatches.length,
        deleted: blogDeleteResult.deletedCount ?? 0
      },
      {
        collection: 'testimonials',
        matched: testimonialMatches.length,
        deleted: testimonialDeleteResult.deletedCount ?? 0
      }
    );

    logger.info('cleanup-demo summary', {
      mode: options.dryRun ? 'dry-run' : 'delete',
      results
    });
  } catch (error) {
    logger.error('cleanup-demo failed', { error });
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

void main();
