import ProjectModel from '@models/Project.model';
import BlogModel from '@models/BlogPost.model';
import CertificateModel from '@models/Certificate.model';
import LabModel from '@models/Lab.model';

interface StatusSummary {
  projects: number;
  blog: number;
  certificates: number;
  labs: number;
  generatedAt: number;
}

const CACHE_TTL = 60 * 1000; // 60 seconds
let cachedSummary: StatusSummary | null = null;

export const fetchStatusSummary = async (): Promise<StatusSummary> => {
  if (cachedSummary && Date.now() - cachedSummary.generatedAt < CACHE_TTL) {
    return cachedSummary;
  }

  const [projects, blog, certificates, labs] = await Promise.all([
    ProjectModel.countDocuments({}),
    BlogModel.countDocuments({}),
    CertificateModel.countDocuments({}),
    LabModel.countDocuments({ active: true })
  ]);

  cachedSummary = {
    projects,
    blog,
    certificates,
    labs,
    generatedAt: Date.now()
  };

  return cachedSummary;
};
