import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import env from '../src/config/env.config';
import connectDatabase, { disconnectDatabase } from '../src/database/connection';
import {
  blogSeedData,
  certificateSeedData,
  projectSeedData,
  testimonialSeedData
} from '../src/database/seeders/sampleData';
import BlogPostModel from '../src/models/BlogPost.model';
import CertificateModel from '../src/models/Certificate.model';
import ProjectModel from '../src/models/Project.model';
import TestimonialModel from '../src/models/Testimonial.model';
import logger from '../src/utils/logger/logger';
import type { Model } from 'mongoose';

const COLLECTIONS = ['projects', 'certificates', 'blog', 'testimonials'] as const;

type SeedCollection = (typeof COLLECTIONS)[number];

interface SeedOptions {
  reset: boolean;
  dryRun: boolean;
  collections: SeedCollection[];
}

const parseArgs = (): SeedOptions => {
  const argv = yargs(hideBin(process.argv))
    .option('collections', {
      alias: 'c',
      type: 'array',
      choices: [...COLLECTIONS, 'all'],
      description: 'Specific collections to seed'
    })
    .option('reset', {
      alias: 'r',
      type: 'boolean',
      default: false,
      description: 'Remove existing documents before seeding'
    })
    .option('dry-run', {
      type: 'boolean',
      default: false,
      description: 'Preview actions without writing to the database'
    })
    .example('npm run seed -- --collections projects blog --reset', 'Reset and seed the selected collections')
    .help()
    .parseSync();

  const rawCollections = (argv.collections as Array<SeedCollection | 'all'> | undefined) ?? ['all'];
  const collections = rawCollections.includes('all')
    ? [...COLLECTIONS]
    : (rawCollections as SeedCollection[]);

  return {
    reset: Boolean(argv.reset),
    dryRun: Boolean(argv.dryRun),
    collections
  };
};

const upsertMany = async <T extends { [key: string]: unknown }>(
  model: Model<any>,
  documents: T[],
  matchKey: string
) => {
  for (const document of documents) {
    // eslint-disable-next-line no-await-in-loop
    await model.updateOne({ [matchKey]: document[matchKey] }, { $set: document }, { upsert: true });
  }
};

const seedProjects = async (reset: boolean, dryRun: boolean) => {
  if (dryRun) {
    logger.info(`[dry-run] Projects to upsert: ${projectSeedData.length}`);
    return projectSeedData.length;
  }

  if (reset) {
    await ProjectModel.deleteMany({});
  }
  await upsertMany(ProjectModel, projectSeedData, 'slug');
  return projectSeedData.length;
};

const seedCertificates = async (reset: boolean, dryRun: boolean) => {
  if (dryRun) {
    logger.info(`[dry-run] Certificates to upsert: ${certificateSeedData.length}`);
    return certificateSeedData.length;
  }
  if (reset) {
    await CertificateModel.deleteMany({});
  }
  await upsertMany(CertificateModel, certificateSeedData, 'slug');
  return certificateSeedData.length;
};

const seedBlogPosts = async (reset: boolean, dryRun: boolean) => {
  if (dryRun) {
    logger.info(`[dry-run] Blog posts to upsert: ${blogSeedData.length}`);
    return blogSeedData.length;
  }
  if (reset) {
    await BlogPostModel.deleteMany({});
  }
  await upsertMany(BlogPostModel, blogSeedData, 'slug');
  return blogSeedData.length;
};

const seedTestimonials = async (reset: boolean, dryRun: boolean) => {
  if (dryRun) {
    logger.info(`[dry-run] Testimonials to upsert: ${testimonialSeedData.length}`);
    return testimonialSeedData.length;
  }
  if (reset) {
    await TestimonialModel.deleteMany({});
  }
  await upsertMany(TestimonialModel, testimonialSeedData, 'name');
  return testimonialSeedData.length;
};

const COLLECTION_SEEDERS: Record<SeedCollection, (reset: boolean, dryRun: boolean) => Promise<number>> = {
  projects: seedProjects,
  certificates: seedCertificates,
  blog: seedBlogPosts,
  testimonials: seedTestimonials
};

const main = async () => {
  const options = parseArgs();
  logger.info(`Seed started in ${env.NODE_ENV} mode`, options);

  if (!options.dryRun) {
    await connectDatabase();
  }

  try {
    let total = 0;
    for (const collection of options.collections) {
      logger.info(`Seeding collection: ${collection}`);
      // eslint-disable-next-line no-await-in-loop
      const count = await COLLECTION_SEEDERS[collection](options.reset, options.dryRun);
      total += count;
      logger.info(`Collection ${collection} processed (${count} documents)`);
    }

    logger.info(`Seed completed. ${total} documents processed.`);
  } catch (error) {
    logger.error('Seed failed', { error });
    process.exitCode = 1;
  } finally {
    if (!options.dryRun) {
      await disconnectDatabase();
    }
  }
};

void main();
