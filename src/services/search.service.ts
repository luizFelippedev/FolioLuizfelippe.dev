import BlogPostModel from '@models/BlogPost.model';
import CertificateModel from '@models/Certificate.model';
import ProjectModel from '@models/Project.model';

interface SearchResult<T> {
  type: 'project' | 'certificate' | 'blog';
  items: T[];
}

export const searchContent = async (term: string, limit: number) => {
  const regex = new RegExp(term, 'i');

  const [projects, certificates, posts] = await Promise.all([
    ProjectModel.find({ $or: [{ title: regex }, { description: regex }, { technologies: regex }] })
      .limit(limit)
      .select('title slug description technologies heroImage featured'),
    CertificateModel.find({ $or: [{ title: regex }, { issuer: regex }, { skills: regex }] })
      .limit(limit)
      .select('title issuer category level previewImage'),
    BlogPostModel.find({ $or: [{ title: regex }, { excerpt: regex }, { tags: regex }] })
      .limit(limit)
      .select('title slug excerpt tags published publishedAt')
  ]);

  const results: Array<SearchResult<unknown>> = [
    { type: 'project', items: projects },
    { type: 'certificate', items: certificates },
    { type: 'blog', items: posts }
  ];

  return {
    term,
    results
  };
};
